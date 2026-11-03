import React from 'react';

export default function DashboardPageLayout({
  isDbConnected,
  specsFromDb,
  header,
  navigation,
  mainContent,
  modalContent,
}) {
  if (!isDbConnected) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-amber-500 space-y-4">
        <svg className="w-12 h-12 animate-spin text-amber-500" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
        <h1 className="text-2xl font-serif italic tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-600">Connecting to Cloud Database...</h1>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-amber-500/30">
      <div className="max-w-10/12 mx-auto px-4 sm:px-6 lg:px-0 py-10 space-y-6">
        {header}
        {navigation}
        <div className="h-px bg-slate-800 w-screen -ml-[calc(50vw-50%)] -mt0" />
        {mainContent}
        {modalContent}
      </div>
    </div>
  );
}
