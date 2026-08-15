-- TBCBankLogger
-- Modern Dark-Themed Guild Bank Scanner, JSON Exporter/Importer,
-- Live Inventory / Sourced Tracker, and Auto-Fill Trade Assistant.

local NUM_GUILD_BANK_TABS = 6
local SLOTS_PER_TAB = 98
local SCAN_DELAY = 0.5

local scannedTabs = {}
local totalItems = 0
local scanInProgress = false
local currentTradePartner = nil
local lastTradeFilledPartner = nil

TBCBankDB = TBCBankDB or {}
TBCBankShoppingList = TBCBankShoppingList or {
    imported_at = nil,
    request_count = 0,
    unique_items = 0,
    items = {},
    characters = {}
}

local currentViewMode = "CHARACTER" -- "CHARACTER" or "ITEM"

-- ─────────────────────────────────────────────
-- Modern Color Palette & UI Theme
-- ─────────────────────────────────────────────

local THEME = {
    bg = {0.08, 0.08, 0.10, 0.96},
    border = {0.22, 0.22, 0.26, 1.0},
    btnNormal = {0.14, 0.14, 0.17, 1.0},
    btnHover = {0.22, 0.22, 0.28, 1.0},
    btnActive = {0.10, 0.10, 0.12, 1.0},
    accent = {0.92, 0.72, 0.22, 1.0}, -- Gold
    text = {0.95, 0.95, 0.95, 1.0},
    textMuted = {0.60, 0.60, 0.65, 1.0},
    success = {0.25, 0.85, 0.45, 1.0}, -- Green
    warning = {0.95, 0.65, 0.20, 1.0}, -- Amber
    info = {0.35, 0.70, 0.95, 1.0},    -- Cyan
    danger = {0.90, 0.30, 0.30, 1.0}   -- Red
}

local FLAT_BACKDROP = {
    bgFile = "Interface\\Buttons\\WHITE8X8",
    edgeFile = "Interface\\Buttons\\WHITE8X8",
    edgeSize = 1,
    insets = { left = 1, right = 1, top = 1, bottom = 1 }
}

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
frame:RegisterEvent("BAG_UPDATE_DELAYED")
frame:RegisterEvent("TRADE_SHOW")
frame:RegisterEvent("TRADE_CLOSED")
frame:RegisterEvent("UI_INFO_MESSAGE")

-- ─────────────────────────────────────────────
-- UI Helper: Modern Button Generator
-- ─────────────────────────────────────────────

local function CreateModernButton(parent, width, height, text, customBg)
    local btn = CreateFrame("Button", nil, parent, "BackdropTemplate")
    btn:SetSize(width, height)
    btn:SetBackdrop(FLAT_BACKDROP)
    
    local normalColor = customBg or THEME.btnNormal
    btn:SetBackdropColor(unpack(normalColor))
    btn:SetBackdropBorderColor(unpack(THEME.border))

    local label = btn:CreateFontString(nil, "OVERLAY", "GameFontHighlightSmall")
    label:SetPoint("CENTER", 0, 0)
    label:SetText(text)
    label:SetTextColor(unpack(THEME.text))
    btn.Text = label

    btn:SetScript("OnEnter", function(self)
        self:SetBackdropColor(unpack(THEME.btnHover))
        self:SetBackdropBorderColor(unpack(THEME.accent))
    end)
    btn:SetScript("OnLeave", function(self)
        self:SetBackdropColor(unpack(normalColor))
        self:SetBackdropBorderColor(unpack(THEME.border))
    end)
    btn:SetScript("OnMouseDown", function(self)
        self:SetBackdropColor(unpack(THEME.btnActive))
        label:SetPoint("CENTER", 1, -1)
    end)
    btn:SetScript("OnMouseUp", function(self)
        self:SetBackdropColor(unpack(THEME.btnHover))
        label:SetPoint("CENTER", 0, 0)
    end)

    return btn
end

-- ─────────────────────────────────────────────
-- Currency Formatters
-- ─────────────────────────────────────────────

local function formatMoney(copperAmount)
    copperAmount = tonumber(copperAmount) or 0
    if copperAmount <= 0 then return "|cff888888Free / 0g|r" end

    local gold = math.floor(copperAmount / 10000)
    local silver = math.floor((copperAmount % 10000) / 100)
    local copper = copperAmount % 100

    local parts = {}
    if gold > 0 then parts[#parts + 1] = string.format("|cffffd700%dg|r", gold) end
    if silver > 0 then parts[#parts + 1] = string.format("|cffc7c7cf%ds|r", silver) end
    if copper > 0 or #parts == 0 then parts[#parts + 1] = string.format("|cffeda55f%dc|r", copper) end

    return table.concat(parts, " ")
end

local function formatMoneyPlain(copperAmount)
    copperAmount = tonumber(copperAmount) or 0
    if copperAmount <= 0 then return "0g" end

    local gold = math.floor(copperAmount / 10000)
    local silver = math.floor((copperAmount % 10000) / 100)
    local copper = copperAmount % 100

    local parts = {}
    if gold > 0 then parts[#parts + 1] = gold .. "g" end
    if silver > 0 then parts[#parts + 1] = silver .. "s" end
    if copper > 0 or #parts == 0 then parts[#parts + 1] = copper .. "c" end

    return table.concat(parts, " ")
end

-- ─────────────────────────────────────────────
-- Live Bag & Inventory Counting Helper
-- ─────────────────────────────────────────────

local function getBagCount(targetId, targetName)
    local totalCount = 0
    targetName = targetName and targetName:lower()

    for bag = 0, 4 do
        for slot = 1, C_Container.GetContainerNumSlots(bag) do
            local info = C_Container.GetContainerItemInfo(bag, slot)
            if info then
                local match = false
                if targetId and targetId > 0 and info.itemID == targetId then
                    match = true
                elseif targetName and info.hyperlink and info.hyperlink:lower():find(targetName, 1, true) then
                    match = true
                end

                if match then
                    totalCount = totalCount + (info.stackCount or 1)
                end
            end
        end
    end
    return totalCount
end

-- ─────────────────────────────────────────────
-- Core Bank Scan Helpers
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

                local itemName, _, _, _, _, itemType, itemSubType = GetItemInfo(itemID)
                itemName = itemName or ("Unknown Item " .. itemID)
                local category = getItemCategory(itemType)

                if TBCBankDB[itemID] then
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
        "|cff00ff00[TBC Bank]|r: Scan complete! |cffffd700%d|r tab(s), |cffffd700%d|r total items logged. Type |cffffd700/gbexport|r to export.",
        tabCount, totalItems))
end

local function startScan()
    if scanInProgress then
        print("|cff00ff00[TBC Bank]|r: Scan already in progress...")
        return
    end

    local foundAccessibleTab = false
    for tab = 1, NUM_GUILD_BANK_TABS do
        if canViewTab(tab) then
            foundAccessibleTab = true
            break
        end
    end

    if not foundAccessibleTab then
        print("|cff00ff00[TBC Bank]|r: |cffff4444Guild bank tabs not readable yet — try again in a moment.|r")
        return
    end

    TBCBankDB = {}
    scannedTabs = {}
    totalItems = 0
    frame.currentScanTab = nil
    scanInProgress = true

    print("|cff00ff00[TBC Bank]|r: Scanning guild bank tabs...")

    for tab = 1, NUM_GUILD_BANK_TABS do
        if canViewTab(tab) then
            frame.currentScanTab = tab
            QueryGuildBankTab(tab)
            return
        end
    end
end

-- ─────────────────────────────────────────────
-- JSON Encoding & Export
-- ─────────────────────────────────────────────

local function escapeJsonString(value)
    local s = tostring(value or "")
    s = s:gsub("\\", "\\\\")
    s = s:gsub('"', '\\"')
    s = s:gsub("\n", "\\n")
    s = s:gsub("\r", "\\r")
    s = s:gsub("\t", "\\t")
    return s
end

local function isArray(tbl)
    if type(tbl) ~= "table" then return false end
    local count = 0
    for k in pairs(tbl) do
        if type(k) ~= "number" then return false end
        count = count + 1
    end
    for i = 1, count do
        if tbl[i] == nil then return false end
    end
    return true
end

local function encodeJson(value)
    local t = type(value)
    if t == "string" then
        return '"' .. escapeJsonString(value) .. '"'
    elseif t == "number" or t == "boolean" then
        return tostring(value)
    elseif t == "table" then
        if isArray(value) then
            local items = {}
            for i = 1, #value do
                items[#items + 1] = encodeJson(value[i])
            end
            return "[" .. table.concat(items, ",") .. "]"
        else
            local entries = {}
            for k, v in pairs(value) do
                if type(k) == "string" then
                    entries[#entries + 1] = '"' .. escapeJsonString(k) .. '":' .. encodeJson(v)
                end
            end
            table.sort(entries)
            return "{" .. table.concat(entries, ",") .. "}"
        end
    end
    return "null"
end

local function buildExportPayload()
    local payload = {
        exported_at = date("!%Y-%m-%dT%H:%M:%SZ"),
        guild = GetGuildInfo("player") or "",
        gold = GetGuildBankMoney() or 0,
        guildGold = GetGuildBankMoney() or 0,
        items = {}
    }

    if TBCBankDB then
        for itemId, item in pairs(TBCBankDB) do
            payload.items[#payload.items + 1] = {
                itemId = tonumber(itemId) or 0,
                count = tonumber(item.count) or 0,
                name = item.name or "",
                category = item.category or "",
                subType = item.subtype or item.subType or ""
            }
        end
    end

    return payload
end

-- ─────────────────────────────────────────────
-- Modern Export UI Frame
-- ─────────────────────────────────────────────

local exportFrame = nil
local function getOrCreateExportFrame()
    if exportFrame then return exportFrame end

    local f = CreateFrame("Frame", "TBCBankLoggerExportFrame", UIParent, "BackdropTemplate")
    f:SetSize(480, 220)
    f:SetPoint("CENTER")
    f:SetFrameStrata("DIALOG")
    f:SetMovable(true)
    f:EnableMouse(true)
    f:RegisterForDrag("LeftButton")
    f:SetScript("OnDragStart", f.StartMoving)
    f:SetScript("OnDragStop", f.StopMovingOrSizing)
    f:SetBackdrop(FLAT_BACKDROP)
    f:SetBackdropColor(unpack(THEME.bg))
    f:SetBackdropBorderColor(unpack(THEME.border))

    local title = f:CreateFontString(nil, "OVERLAY", "GameFontNormal")
    title:SetPoint("TOPLEFT", 18, -14)
    title:SetText("Export Guild Bank Data")
    title:SetTextColor(unpack(THEME.accent))

    local subtitle = f:CreateFontString(nil, "OVERLAY", "GameFontHighlightSmall")
    subtitle:SetPoint("TOPLEFT", 18, -32)
    subtitle:SetText("Press |cffffd700Ctrl+C|r to copy JSON payload:")
    subtitle:SetTextColor(unpack(THEME.textMuted))

    local scroll = CreateFrame("ScrollFrame", nil, f, "UIPanelScrollFrameTemplate")
    scroll:SetPoint("TOPLEFT", 18, -54)
    scroll:SetPoint("BOTTOMRIGHT", -36, 48)

    local eb = CreateFrame("EditBox", nil, scroll)
    eb:SetMultiLine(true)
    eb:SetSize(420, 110)
    eb:SetAutoFocus(true)
    eb:SetFontObject(ChatFontNormal)
    eb:SetTextColor(unpack(THEME.text))
    eb:SetScript("OnEscapePressed", function() f:Hide() end)
    scroll:SetScrollChild(eb)
    f.editBox = eb

    local closeBtn = CreateModernButton(f, 90, 24, "Close")
    closeBtn:SetPoint("BOTTOMRIGHT", -18, 14)
    closeBtn:SetScript("OnClick", function() f:Hide() end)

    tinsert(UISpecialFrames, "TBCBankLoggerExportFrame")
    exportFrame = f
    return f
end

local function showExportPopup()
    local payload = buildExportPayload()
    if not payload.items or #payload.items == 0 then
        print("|cff00ff00[TBC Bank]|r: No bank data available to export. Scan first with /gbscan.")
        return
    end

    local jsonText = encodeJson(payload)
    local f = getOrCreateExportFrame()
    f:Show()
    f.editBox:SetText(jsonText)
    f.editBox:HighlightText()
    f.editBox:SetFocus()
end

-- ─────────────────────────────────────────────
-- JSON Decoding & Aggregation (Import)
-- ─────────────────────────────────────────────

local function jsonTrim(str)
    return (str:gsub("^%s+", ""):gsub("%s+$", ""))
end

local function jsonDecode(text)
    local i = 1
    local len = #text

    local function skipWhitespace()
        while i <= len and text:sub(i, i):match("%s") do
            i = i + 1
        end
    end

    local function parseString()
        local chars = {}
        i = i + 1
        while i <= len do
            local ch = text:sub(i, i)
            if ch == '"' then
                i = i + 1
                return table.concat(chars), i
            elseif ch == '\\' then
                local nextChar = text:sub(i + 1, i + 1)
                if nextChar == '"' then chars[#chars + 1] = '"'; i = i + 2
                elseif nextChar == '\\' then chars[#chars + 1] = '\\'; i = i + 2
                elseif nextChar == '/' then chars[#chars + 1] = '/'; i = i + 2
                elseif nextChar == 'b' then chars[#chars + 1] = '\b'; i = i + 2
                elseif nextChar == 'f' then chars[#chars + 1] = '\f'; i = i + 2
                elseif nextChar == 'n' then chars[#chars + 1] = '\n'; i = i + 2
                elseif nextChar == 'r' then chars[#chars + 1] = '\r'; i = i + 2
                elseif nextChar == 't' then chars[#chars + 1] = '\t'; i = i + 2
                elseif nextChar == 'u' then
                    local hex = text:sub(i + 2, i + 5)
                    local code = tonumber(hex, 16)
                    if code then chars[#chars + 1] = string.char(code); i = i + 6
                    else error("Invalid unicode escape") end
                else error("Unsupported escape sequence") end
            elseif ch == '\n' or ch == '\r' then error("Unescaped newline")
            else
                chars[#chars + 1] = ch
                i = i + 1
            end
        end
        error("Unterminated string")
    end

    local function parseNumber()
        local start = i
        while i <= len and text:sub(i, i):match('[%+%-%d%.eE]') do i = i + 1 end
        local val = tonumber(text:sub(start, i - 1))
        if val == nil then error("Invalid number") end
        return val, i
    end

    local parseValue

    local function parseArray()
        local result = {}
        i = i + 1
        skipWhitespace()
        if text:sub(i, i) == ']' then i = i + 1; return result end
        while true do
            skipWhitespace()
            result[#result + 1] = parseValue()
            skipWhitespace()
            local ch = text:sub(i, i)
            if ch == ',' then i = i + 1
            elseif ch == ']' then i = i + 1; break
            else error("Expected , or ] in array") end
        end
        return result
    end

    local function parseObject()
        local result = {}
        i = i + 1
        skipWhitespace()
        if text:sub(i, i) == '}' then i = i + 1; return result end
        while true do
            skipWhitespace()
            local key = parseString()
            skipWhitespace()
            if text:sub(i, i) ~= ':' then error("Expected : in object") end
            i = i + 1
            result[key] = parseValue()
            skipWhitespace()
            local ch = text:sub(i, i)
            if ch == ',' then i = i + 1
            elseif ch == '}' then i = i + 1; break
            else error("Expected , or } in object") end
        end
        return result
    end

    function parseValue()
        skipWhitespace()
        local ch = text:sub(i, i)
        if ch == '{' then return parseObject()
        elseif ch == '[' then return parseArray()
        elseif ch == '"' then return parseString()
        elseif ch == 't' then
            if text:sub(i, i + 3) == 'true' then i = i + 4; return true end
            error("Invalid true")
        elseif ch == 'f' then
            if text:sub(i, i + 4) == 'false' then i = i + 5; return false end
            error("Invalid false")
        elseif ch == 'n' then
            if text:sub(i, i + 3) == 'null' then i = i + 4; return nil end
            error("Invalid null")
        elseif ch:match('[%+%-%d]') then return parseNumber()
        else error("Unexpected token: " .. tostring(ch)) end
    end

    local parsed = parseValue()
    skipWhitespace()
    return parsed
end

local function aggregateApprovedRequests(payload)
    local requests = payload and (payload.requests or payload.items or payload)
    if type(requests) ~= "table" then
        return nil, "Invalid approved bank requests payload."
    end

    local aggregatedItems = {}
    local aggregatedChars = {}
    local requestCount = 0

    for _, req in ipairs(requests) do
        if type(req) == "table" then
            local qty = tonumber(req.approved_quantity) or tonumber(req.quantity) or tonumber(req.count) or 0
            if qty > 0 then
                requestCount = requestCount + 1
                local itemId = tonumber(req.item_wowhead_id) or tonumber(req.itemId) or tonumber(req.item_id) or 0
                local itemName = req.item_name or req.name or "Unknown item"
                local requester = req.requester_name or req.character or req.player or "Unknown"

                -- Direct Total Gold parsing
                local totalCopper = 0
                if req.total_price_copper or req.price_copper or req.cost_copper then
                    totalCopper = tonumber(req.total_price_copper) or tonumber(req.price_copper) or tonumber(req.cost_copper) or 0
                elseif req.total_price or req.price or req.cost or req.amount or req.total_cost then
                    local totalGold = tonumber(req.total_price) or tonumber(req.price) or tonumber(req.cost) or tonumber(req.amount) or tonumber(req.total_cost) or 0
                    totalCopper = math.floor(totalGold * 10000)
                elseif req.unit_price_copper then
                    totalCopper = (tonumber(req.unit_price_copper) or 0) * qty
                elseif req.unit_price then
                    totalCopper = math.floor((tonumber(req.unit_price) or 0) * 10000) * qty
                end

                local derivedUnitCopper = (qty > 0) and math.floor(totalCopper / qty) or totalCopper

                -- 1. Aggregation by Item
                local itemKey = tostring(itemId) .. ":" .. itemName
                if not aggregatedItems[itemKey] then
                    aggregatedItems[itemKey] = {
                        itemId = itemId,
                        itemName = itemName,
                        totalQty = 0,
                        totalCostCopper = 0,
                        unitPriceCopper = derivedUnitCopper,
                        requestors = {}
                    }
                end
                local iEntry = aggregatedItems[itemKey]
                iEntry.totalQty = iEntry.totalQty + qty
                iEntry.totalCostCopper = iEntry.totalCostCopper + totalCopper
                iEntry.unitPriceCopper = (iEntry.totalQty > 0) and math.floor(iEntry.totalCostCopper / iEntry.totalQty) or derivedUnitCopper
                iEntry.requestors[#iEntry.requestors + 1] = {
                    name = requester,
                    quantity = qty,
                    totalPriceCopper = totalCopper,
                    traded = false
                }

                -- 2. Aggregation by Character
                local charKey = requester:lower()
                if not aggregatedChars[charKey] then
                    aggregatedChars[charKey] = {
                        characterName = requester,
                        totalCostCopper = 0,
                        items = {}
                    }
                end
                local cEntry = aggregatedChars[charKey]
                cEntry.totalCostCopper = cEntry.totalCostCopper + totalCopper
                cEntry.items[#cEntry.items + 1] = {
                    itemId = itemId,
                    itemName = itemName,
                    quantity = qty,
                    unitPriceCopper = derivedUnitCopper,
                    totalPriceCopper = totalCopper,
                    traded = false
                }
            end
        end
    end

    local orderedItems = {}
    for _, itemEntry in pairs(aggregatedItems) do orderedItems[#orderedItems + 1] = itemEntry end
    table.sort(orderedItems, function(a, b) return (a.itemName or ""):lower() < (b.itemName or ""):lower() end)

    local orderedChars = {}
    for _, charEntry in pairs(aggregatedChars) do orderedChars[#orderedChars + 1] = charEntry end
    table.sort(orderedChars, function(a, b) return (a.characterName or ""):lower() < (b.characterName or ""):lower() end)

    return {
        imported_at = date("!%Y-%m-%dT%H:%M:%SZ"),
        request_count = requestCount,
        unique_items = #orderedItems,
        items = orderedItems,
        characters = orderedChars
    }
end

-- ─────────────────────────────────────────────
-- Formatted Shopping List Views with Live Status
-- ─────────────────────────────────────────────

local function buildShoppingListByItemText(list)
    local lines = {
        "|cffffd700=== Guild Bank Shopping List (By Item) ===|r",
        "|cff888888Track sourced materials across your bags and bank.|r",
        ""
    }
    if not list or #list == 0 then
        lines[#lines + 1] = "|cff888888No approved items imported yet.|r"
        lines[#lines + 1] = "Click '|cffffd700Paste JSON|r' to load your approved requests."
        return table.concat(lines, "\n")
    end

    local totalSourcedDistinct = 0
    for _, itemEntry in ipairs(list) do
        local itemName = itemEntry.itemName or "Unknown item"
        if itemEntry.itemId > 0 then
            local resolved = select(1, GetItemInfo(itemEntry.itemId))
            if resolved then itemName = resolved end
        end

        local inBags = getBagCount(itemEntry.itemId, itemName)
        local statusBadge = ""

        if inBags >= itemEntry.totalQty then
            statusBadge = string.format("|cff40ff40[✔ Sourced: %d/%d]|r", inBags, itemEntry.totalQty)
            totalSourcedDistinct = totalSourcedDistinct + 1
        elseif inBags > 0 then
            statusBadge = string.format("|cffffa500[⏳ In Bags: %d/%d (Need %d)]|r", inBags, itemEntry.totalQty, itemEntry.totalQty - inBags)
        else
            statusBadge = string.format("|cffff4040[✖ Missing: 0/%d]|r", itemEntry.totalQty)
        end

        local reqs = {}
        for _, req in ipairs(itemEntry.requestors or {}) do
            local tradeStatus = req.traded and "|cff40ff40(Traded)|r" or "|cff888888(Pending)|r"
            if req.totalPriceCopper and req.totalPriceCopper > 0 then
                reqs[#reqs + 1] = string.format("%s x%d [%s] %s", req.name, req.quantity, formatMoney(req.totalPriceCopper), tradeStatus)
            else
                reqs[#reqs + 1] = string.format("%s x%d %s", req.name, req.quantity, tradeStatus)
            end
        end

        if itemEntry.totalCostCopper and itemEntry.totalCostCopper > 0 then
            lines[#lines + 1] = string.format("|cffffffff%s|r x%d  %s  |cffffd700(Total: %s)|r", itemName, itemEntry.totalQty, statusBadge, formatMoney(itemEntry.totalCostCopper))
        else
            lines[#lines + 1] = string.format("|cffffffff%s|r x%d  %s", itemName, itemEntry.totalQty, statusBadge)
        end
        lines[#lines + 1] = "  |cff888888Requesters:|r " .. table.concat(reqs, ", ")
        lines[#lines + 1] = ""
    end

    lines[3] = string.format("|cff888888Progress: %d / %d item types fully in bags.|r\n", totalSourcedDistinct, #list)
    return table.concat(lines, "\n")
end

local function buildShoppingListByCharacterText(charList)
    local lines = {
        "|cffffd700=== Guild Bank Shopping List (By Character) ===|r",
        "|cff888888View orders, dues, bag fulfillment, and trade status.|r",
        ""
    }
    if not charList or #charList == 0 then
        lines[#lines + 1] = "|cff888888No approved character requests found.|r"
        return table.concat(lines, "\n")
    end

    for _, charEntry in ipairs(charList) do
        local allItemsTraded = true
        local allItemsInBags = true
        local pendingCost = 0

        for _, item in ipairs(charEntry.items or {}) do
            if not item.traded then
                allItemsTraded = false
                pendingCost = pendingCost + item.totalPriceCopper
            end
            local countInBags = getBagCount(item.itemId, item.itemName)
            if countInBags < item.quantity then
                allItemsInBags = false
            end
        end

        local headerStatus = ""
        if allItemsTraded then
            headerStatus = " |cff40ff40[✔ Order Completed]|r"
        elseif allItemsInBags then
            headerStatus = " |cff00ffff[Ready to Trade]|r"
        else
            headerStatus = " |cffffa500[Sourcing Items]|r"
        end

        lines[#lines + 1] = string.format("|cffffd700== %s ==|r%s |cffffffff(Due: %s)|r", charEntry.characterName, headerStatus, formatMoney(pendingCost))
        
        for _, item in ipairs(charEntry.items or {}) do
            local itemName = item.itemName
            if item.itemId > 0 then
                local resolved = select(1, GetItemInfo(item.itemId))
                if resolved then itemName = resolved end
            end

            local inBags = getBagCount(item.itemId, itemName)
            local itemStatus = ""
            if item.traded then
                itemStatus = "|cff40ff40[✔ Traded]|r"
            elseif inBags >= item.quantity then
                itemStatus = string.format("|cff00ffff[In Bags: %d/%d]|r", inBags, item.quantity)
            elseif inBags > 0 then
                itemStatus = string.format("|cffffa500[Partial: %d/%d]|r", inBags, item.quantity)
            else
                itemStatus = "|cffff4040[Missing]|r"
            end

            if item.totalPriceCopper > 0 then
                lines[#lines + 1] = string.format("  • %s x%d - %s (%s)", itemName, item.quantity, itemStatus, formatMoney(item.totalPriceCopper))
            else
                lines[#lines + 1] = string.format("  • %s x%d - %s", itemName, item.quantity, itemStatus)
            end
        end
        lines[#lines + 1] = ""
    end
    return table.concat(lines, "\n")
end

-- ─────────────────────────────────────────────
-- Trade Automation Helper
-- ─────────────────────────────────────────────

local function getPendingItemsForPlayer(playerName)
    if not playerName or not TBCBankShoppingList or not TBCBankShoppingList.characters then return nil end
    local key = playerName:lower():match("^[^-]+")
    for _, charEntry in ipairs(TBCBankShoppingList.characters) do
        if charEntry.characterName:lower():match("^[^-]+") == key then
            return charEntry
        end
    end
    return nil
end

local function fillTradeWindowForPlayer(charEntry)
    if not charEntry or not charEntry.items then return end
    
    local tradeSlot = 1
    local itemsAdded = 0

    for _, item in ipairs(charEntry.items) do
        if not item.traded then
            local needed = item.quantity
            local targetId = item.itemId
            local targetName = item.itemName:lower()

            for bag = 0, 4 do
                for slot = 1, C_Container.GetContainerNumSlots(bag) do
                    if tradeSlot > 6 then break end
                    local info = C_Container.GetContainerItemInfo(bag, slot)
                    if info and needed > 0 then
                        local match = false
                        if targetId > 0 and info.itemID == targetId then
                            match = true
                        elseif info.hyperlink and info.hyperlink:lower():find(targetName, 1, true) then
                            match = true
                        end

                        if match then
                            C_Container.PickupContainerItem(bag, slot)
                            ClickTradeButton(tradeSlot)
                            needed = needed - info.stackCount
                            tradeSlot = tradeSlot + 1
                            itemsAdded = itemsAdded + 1
                        end
                    end
                end
            end
        end
    end

    if itemsAdded > 0 then
        lastTradeFilledPartner = charEntry.characterName
        print(string.format("|cff00ff00[TBC Bank]|r: Filled |cffffd700%d|r trade slot(s) for |cffffd700%s|r.", itemsAdded, charEntry.characterName))
    else
        print(string.format("|cff00ff00[TBC Bank]|r: Could not find untraded items in bags for |cffffd700%s|r.", charEntry.characterName))
    end
end

local function markPlayerItemsAsTraded(playerName)
    local charEntry = getPendingItemsForPlayer(playerName)
    if not charEntry or not charEntry.items then return end

    for _, item in ipairs(charEntry.items) do
        item.traded = true
    end

    -- Also update item list representation
    if TBCBankShoppingList and TBCBankShoppingList.items then
        local key = playerName:lower():match("^[^-]+")
        for _, iEntry in ipairs(TBCBankShoppingList.items) do
            for _, r in ipairs(iEntry.requestors or {}) do
                if r.name:lower():match("^[^-]+") == key then
                    r.traded = true
                end
            end
        end
    end
    print(string.format("|cff00ff00[TBC Bank]|r: Marked order for |cffffd700%s|r as |cff40ff40Traded|r.", charEntry.characterName))
end

-- ─────────────────────────────────────────────
-- Modern Floating Trade Prompt Frame
-- ─────────────────────────────────────────────

local tradePromptFrame = CreateFrame("Frame", "TBCBankTradePrompt", UIParent, "BackdropTemplate")
tradePromptFrame:SetSize(290, 125)
tradePromptFrame:SetPoint("TOPLEFT", TradeFrame, "TOPRIGHT", 8, 0)
tradePromptFrame:SetBackdrop(FLAT_BACKDROP)
tradePromptFrame:SetBackdropColor(unpack(THEME.bg))
tradePromptFrame:SetBackdropBorderColor(unpack(THEME.accent))
tradePromptFrame:Hide()

local tradeHeader = tradePromptFrame:CreateFontString(nil, "OVERLAY", "GameFontNormal")
tradeHeader:SetPoint("TOPLEFT", 12, -10)
tradeHeader:SetText("Guild Bank Trade Assistant")
tradeHeader:SetTextColor(unpack(THEME.accent))

local tradeText = tradePromptFrame:CreateFontString(nil, "OVERLAY", "GameFontHighlightSmall")
tradeText:SetPoint("TOPLEFT", 12, -28)
tradeText:SetWidth(266)
tradeText:SetJustifyH("LEFT")

local fillBtn = CreateModernButton(tradePromptFrame, 128, 24, "Fill Trade", THEME.btnNormal)
fillBtn:SetPoint("BOTTOMLEFT", 12, 10)

local whisperBtn = CreateModernButton(tradePromptFrame, 128, 24, "Whisper Bill", THEME.btnNormal)
whisperBtn:SetPoint("BOTTOMRIGHT", -12, 10)

local markTradedBtn = CreateModernButton(tradePromptFrame, 266, 20, "✔ Mark as Fulfilled", {0.12, 0.28, 0.16, 1.0})
markTradedBtn:SetPoint("BOTTOM", 0, 38)

-- ─────────────────────────────────────────────
-- Modern Main Shopping List & Import UI Frame
-- ─────────────────────────────────────────────

local importFrame = nil

local function updateEditBoxContent(f, text, isReadOnly)
    if not f or not f.editBox then return end
    f.editBox:SetText(text or "")
    f.editBox:SetCursorPosition(0)
    if f.scrollFrame then f.scrollFrame:SetVerticalScroll(0) end
    if isReadOnly then f.editBox:ClearFocus() else f.editBox:SetFocus(); f.editBox:HighlightText() end
end

local function refreshShoppingListView(f)
    if not f then return end
    if currentViewMode == "CHARACTER" then
        local charList = TBCBankShoppingList and TBCBankShoppingList.characters or {}
        f.title:SetText("Guild Bank Requests (By Character)")
        updateEditBoxContent(f, buildShoppingListByCharacterText(charList), true)
        f.toggleViewBtn:SetText("View by Item")
    else
        local itemList = TBCBankShoppingList and TBCBankShoppingList.items or {}
        f.title:SetText("Guild Bank Shopping List (By Item)")
        updateEditBoxContent(f, buildShoppingListByItemText(itemList), true)
        f.toggleViewBtn:SetText("View by Character")
    end
end

local function getOrCreateImportFrame()
    if importFrame then return importFrame end

    local f = CreateFrame("Frame", "TBCBankLoggerImportFrame", UIParent, "BackdropTemplate")
    f:SetSize(660, 520)
    f:SetPoint("CENTER")
    f:SetFrameStrata("DIALOG")
    f:SetMovable(true)
    f:EnableMouse(true)
    f:RegisterForDrag("LeftButton")
    f:SetScript("OnDragStart", f.StartMoving)
    f:SetScript("OnDragStop", f.StopMovingOrSizing)
    f:SetBackdrop(FLAT_BACKDROP)
    f:SetBackdropColor(unpack(THEME.bg))
    f:SetBackdropBorderColor(unpack(THEME.border))

    local title = f:CreateFontString(nil, "OVERLAY", "GameFontNormalMed2")
    title:SetPoint("TOPLEFT", 20, -16)
    title:SetText("Guild Bank Shopping List")
    title:SetTextColor(unpack(THEME.accent))
    f.title = title

    local closeCross = CreateFrame("Button", nil, f, "BackdropTemplate")
    closeCross:SetSize(22, 22)
    closeCross:SetPoint("TOPRIGHT", -10, -10)
    closeCross:SetBackdrop(FLAT_BACKDROP)
    closeCross:SetBackdropColor(0, 0, 0, 0)
    closeCross:SetBackdropBorderColor(0, 0, 0, 0)
    local closeText = closeCross:CreateFontString(nil, "OVERLAY", "GameFontHighlightSmall")
    closeText:SetPoint("CENTER", 0, 0)
    closeText:SetText("✕")
    closeText:SetTextColor(unpack(THEME.textMuted))
    closeCross:SetScript("OnEnter", function() closeText:SetTextColor(unpack(THEME.danger)) end)
    closeCross:SetScript("OnLeave", function() closeText:SetTextColor(unpack(THEME.textMuted)) end)
    closeCross:SetScript("OnClick", function() f:Hide() end)

    local scroll = CreateFrame("ScrollFrame", "TBCBankLoggerImportScroll", f, "UIPanelScrollFrameTemplate")
    scroll:SetPoint("TOPLEFT", 20, -46)
    scroll:SetPoint("BOTTOMRIGHT", -38, 54)
    f.scrollFrame = scroll

    local editBox = CreateFrame("EditBox", "TBCBankLoggerImportEditBox", scroll)
    editBox:SetMultiLine(true)
    editBox:SetFontObject(ChatFontNormal)
    editBox:SetTextColor(unpack(THEME.text))
    editBox:SetWidth(575)
    editBox:SetAutoFocus(false)
    editBox:EnableMouse(true)
    editBox:SetMaxLetters(0)
    editBox:SetTextInsets(6, 6, 6, 6)

    editBox:SetScript("OnTextChanged", function(self)
        if self:GetHeight() and self:GetHeight() > 0 then scroll:UpdateScrollChildRect() end
    end)
    editBox:SetScript("OnCursorChanged", function(self, x, y)
        if y and self:GetParent() then self:GetParent():SetVerticalScroll((y < 0 and -y or 0)) end
    end)
    editBox:SetScript("OnEscapePressed", function() f:Hide() end)
    scroll:SetScript("OnMouseDown", function() editBox:SetFocus() end)
    scroll:SetScrollChild(editBox)
    f.editBox = editBox

    -- Bottom Bar Modern Buttons
    local importBtn = CreateModernButton(f, 115, 26, "Import JSON", {0.18, 0.28, 0.20, 1.0})
    importBtn:SetPoint("BOTTOMLEFT", 20, 16)
    importBtn:SetScript("OnClick", function()
        local text = jsonTrim(f.editBox:GetText() or "")
        if text == "" then
            print("|cff00ff00[TBC Bank]|r: Paste the approved requests JSON into the box first.")
            return
        end
        local ok, parsed = pcall(jsonDecode, text)
        if not ok then
            print("|cff00ff00[TBC Bank]|r: |cffff4444Unable to parse that JSON.|r")
            return
        end
        local list, err = aggregateApprovedRequests(parsed)
        if not list then
            print("|cff00ff00[TBC Bank]|r: |cffff4444" .. tostring(err) .. "|r")
            return
        end
        TBCBankShoppingList = list
        print(string.format("|cff00ff00[TBC Bank]|r: Imported %d approved requests for %d unique items.", list.request_count, list.unique_items))
        refreshShoppingListView(f)
    end)

    local toggleBtn = CreateModernButton(f, 135, 26, "View by Item")
    toggleBtn:SetPoint("BOTTOMLEFT", 145, 16)
    toggleBtn:SetScript("OnClick", function()
        currentViewMode = (currentViewMode == "CHARACTER") and "ITEM" or "CHARACTER"
        refreshShoppingListView(f)
    end)
    f.toggleViewBtn = toggleBtn

    local refreshBagsBtn = CreateModernButton(f, 115, 26, "Refresh Bags")
    refreshBagsBtn:SetPoint("BOTTOMLEFT", 290, 16)
    refreshBagsBtn:SetScript("OnClick", function()
        refreshShoppingListView(f)
        print("|cff00ff00[TBC Bank]|r: Refreshed inventory & bag statuses.")
    end)

    local pasteModeBtn = CreateModernButton(f, 110, 26, "Paste JSON")
    pasteModeBtn:SetPoint("BOTTOMLEFT", 415, 16)
    pasteModeBtn:SetScript("OnClick", function()
        f.title:SetText("Paste Approved Requests JSON")
        updateEditBoxContent(f, "", false)
    end)

    local closeBtn = CreateModernButton(f, 85, 26, "Close")
    closeBtn:SetPoint("BOTTOMRIGHT", -20, 16)
    closeBtn:SetScript("OnClick", function() f:Hide() end)

    tinsert(UISpecialFrames, "TBCBankLoggerImportFrame")
    importFrame = f
    return f
end

local function showShoppingList()
    local f = getOrCreateImportFrame()
    f:Show()
    refreshShoppingListView(f)
end

-- ─────────────────────────────────────────────
-- Event Handling
-- ─────────────────────────────────────────────

frame:SetScript("OnEvent", function(self, event, ...)
    if event == "GUILDBANKFRAME_OPENED" then
        C_Timer.After(SCAN_DELAY, function()
            print("|cff00ff00[TBC Bank]|r: Guild bank opened — auto-scanning.")
            startScan()
        end)

    elseif event == "GUILDBANKFRAME_CLOSED" then
        scanInProgress = false
        scannedTabs = {}
        frame.currentScanTab = nil

    elseif event == "GUILDBANKBAGSLOTS_CHANGED" then
        local tab = frame.currentScanTab
        if not tab then return end
        scanTab(tab)
        scannedTabs[tab] = true
        frame.currentScanTab = nil

        local nextTab = tab + 1
        while nextTab <= NUM_GUILD_BANK_TABS do
            if canViewTab(nextTab) then
                frame.currentScanTab = nextTab
                QueryGuildBankTab(nextTab)
                return
            end
            nextTab = nextTab + 1
        end
        finaliseScan()

    elseif event == "BAG_UPDATE_DELAYED" then
        if importFrame and importFrame:IsShown() then
            refreshShoppingListView(importFrame)
        end

    elseif event == "TRADE_SHOW" then
        local partnerName = UnitName("NPC")
        currentTradePartner = partnerName

        if partnerName then
            local pending = getPendingItemsForPlayer(partnerName)
            if pending then
                tradePromptFrame:SetPoint("TOPLEFT", TradeFrame, "TOPRIGHT", 8, 0)
                tradeText:SetText(string.format("Partner: |cffffd700%s|r\nTotal Due: %s", pending.characterName, formatMoney(pending.totalCostCopper)))
                
                fillBtn:SetScript("OnClick", function()
                    fillTradeWindowForPlayer(pending)
                end)
                
                whisperBtn:SetScript("OnClick", function()
                    local msgList = {}
                    for _, item in ipairs(pending.items) do
                        msgList[#msgList + 1] = item.itemName .. " x" .. item.quantity
                    end
                    local msg = string.format("[TBC Bank]: Your order: %s. Total Due: %s.", table.concat(msgList, ", "), formatMoneyPlain(pending.totalCostCopper))
                    SendChatMessage(msg, "WHISPER", nil, partnerName)
                end)

                markTradedBtn:SetScript("OnClick", function()
                    markPlayerItemsAsTraded(partnerName)
                    tradePromptFrame:Hide()
                    if importFrame and importFrame:IsShown() then
                        refreshShoppingListView(importFrame)
                    end
                end)

                tradePromptFrame:Show()
            end
        end

    elseif event == "TRADE_CLOSED" then
        tradePromptFrame:Hide()
        currentTradePartner = nil

    elseif event == "UI_INFO_MESSAGE" then
        local messageType, msg = ...
        -- If trade complete message triggers, automatically mark fulfilled
        if msg and (msg:find("Trade complete") or msg:find("Handel abgeschlossen") or msg:find("Échange terminé")) then
            if lastTradeFilledPartner then
                markPlayerItemsAsTraded(lastTradeFilledPartner)
                lastTradeFilledPartner = nil
                if importFrame and importFrame:IsShown() then
                    refreshShoppingListView(importFrame)
                end
            end
        end
    end
end)

-- ─────────────────────────────────────────────
-- Slash Commands
-- ─────────────────────────────────────────────

SLASH_GBSCAN1 = "/gbscan"
SlashCmdList["GBSCAN"] = function() startScan() end

SLASH_GBEXPORT1 = "/gbexport"
SlashCmdList["GBEXPORT"] = function() showExportPopup() end

SLASH_GBIMPORT1 = "/gbimport"
SlashCmdList["GBIMPORT"] = function(msg)
    showShoppingList()
end