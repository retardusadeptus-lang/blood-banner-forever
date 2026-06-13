-- TBCBankLogger
-- Auto-scans the guild bank on open, and also supports /gbscan manually.
-- Saves itemID -> {count, name, category} to TBCBankDB for guild website upload.
-- Compatible with bag addons (Baganator, BagBrother, etc.)
local NUM_GUILD_BANK_TABS = 6 -- TBC has up to 6 guild bank tabs
local SLOTS_PER_TAB = 98 -- Each tab has 98 slots
local SCAN_DELAY = 0.5 -- Seconds to wait after open before auto-scanning
-- (gives bag addons time to finish hooking the frame)

local scannedTabs = {}
local totalItems = 0
local scanInProgress = false

-- Maps WoW item type/subtype strings to the category names the website expects
local CATEGORY_MAP = {
    ["Consumable"] = "Consumable",
    ["Trade Goods"] = "Trade Goods",
    ["Gem"] = "Gem",
    ["Armor"] = "Armor",
    ["Weapon"] = "Weapon",
    ["Recipe"] = "Recipe",
    ["Miscellaneous"] = "Miscellaneous",
    ["Quest"] = "Quest",
    ["Key"] = "Key"
}

local frame = CreateFrame("Frame")
frame:RegisterEvent("GUILDBANKFRAME_OPENED")
frame:RegisterEvent("GUILDBANKFRAME_CLOSED")
frame:RegisterEvent("GUILDBANKBAGSLOTS_CHANGED")

-- ─────────────────────────────────────────────
-- Core scan helpers
-- ─────────────────────────────────────────────

local function canViewTab(tab)
    local name, icon, isViewable = GetGuildBankTabInfo(tab)
    return isViewable == 1 or isViewable == true
end

local function getItemCategory(itemType)
    return CATEGORY_MAP[itemType] or "Misc"
end

local function scanTab(tab)
    for slot = 1, SLOTS_PER_TAB do
        local link = GetGuildBankItemLink(tab, slot)
        if link then
            local itemID = tonumber(string.match(link, "item:(%d+)"))
            if itemID and itemID > 0 then
                local _, count = GetGuildBankItemInfo(tab, slot)
                count = count or 1

                -- GetItemInfo returns: name, link, rarity, level, minLevel, type, subType,
                --                      stackCount, equipLoc, texture, sellPrice
                local itemName, _, _, _, _, itemType, itemSubType = GetItemInfo(itemID)
                itemName = itemName or ("Unknown Item " .. itemID)
                local category = getItemCategory(itemType)

                if TBCBankDB[itemID] then
                    -- Item already seen in another tab — add to its count
                    TBCBankDB[itemID]["count"] = TBCBankDB[itemID]["count"] + count
                else
                    TBCBankDB[itemID] = {
                        ["count"] = count,
                        ["name"] = itemName,
                        ["category"] = category,
                        ["subtype"] = itemSubType or ""
                    }
                end

                totalItems = totalItems + count
            end
        end
    end
end

local function finaliseScan()
    scanInProgress = false
    local tabCount = 0
    for _ in pairs(scannedTabs) do
        tabCount = tabCount + 1
    end
    print(string.format(
        "|cff00ff00[TBC Bank]|r: Scan complete! |cffffd700%d|r tab(s), |cffffd700%d|r total items logged. Logout or reload UI to save.",
        tabCount, totalItems))
end

local function startScan()
    if scanInProgress then
        print("|cff00ff00[TBC Bank]|r: Scan already in progress...")
        return
    end

    -- Verify guild bank data is actually accessible before starting
    local foundAccessibleTab = false
    for tab = 1, NUM_GUILD_BANK_TABS do
        if canViewTab(tab) then
            foundAccessibleTab = true
            break
        end
    end

    if not foundAccessibleTab then
        print(
            "|cff00ff00[TBC Bank]|r: |cffff4444Guild bank tabs not readable yet — try again in a moment, or reopen the guild bank.|r")
        return
    end

    -- Reset for a fresh scan
    TBCBankDB = {}
    scannedTabs = {}
    totalItems = 0
    frame.currentScanTab = nil
    scanInProgress = true

    print("|cff00ff00[TBC Bank]|r: Scanning guild bank tabs...")

    -- Find first accessible tab and kick off the async query chain
    for tab = 1, NUM_GUILD_BANK_TABS do
        if canViewTab(tab) then
            frame.currentScanTab = tab
            QueryGuildBankTab(tab)
            return
        end
    end
end

-- ─────────────────────────────────────────────
-- Event handler
-- ─────────────────────────────────────────────

frame:SetScript("OnEvent", function(self, event, ...)
    if event == "GUILDBANKFRAME_OPENED" then
        -- Delay auto-scan slightly so bag addons finish their hooks
        C_Timer.After(SCAN_DELAY, function()
            print("|cff00ff00[TBC Bank]|r: Guild bank opened — auto-scanning. Use |cffffd700/gbscan|r to rescan.")
            startScan()
        end)

    elseif event == "GUILDBANKFRAME_CLOSED" then
        scanInProgress = false
        scannedTabs = {}
        frame.currentScanTab = nil

    elseif event == "GUILDBANKBAGSLOTS_CHANGED" then
        -- Fired when QueryGuildBankTab() finishes loading a tab's contents
        local tabBeingScanned = frame.currentScanTab
        if not tabBeingScanned then
            return
        end

        scanTab(tabBeingScanned)
        scannedTabs[tabBeingScanned] = true
        frame.currentScanTab = nil

        -- Advance to the next accessible tab
        local nextTab = tabBeingScanned + 1
        while nextTab <= NUM_GUILD_BANK_TABS do
            if canViewTab(nextTab) then
                frame.currentScanTab = nextTab
                QueryGuildBankTab(nextTab)
                return
            end
            nextTab = nextTab + 1
        end

        -- No more tabs — we're done
        finaliseScan()
    end
end)

-- ─────────────────────────────────────────────
-- Slash command — manual rescan
-- ─────────────────────────────────────────────

SLASH_GBSCAN1 = "/gbscan"
SlashCmdList["GBSCAN"] = function()
    startScan()
end
