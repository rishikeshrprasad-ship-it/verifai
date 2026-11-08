import React, { useState, useEffect } from 'react';
import { HistoryItem } from '../types';
import { safeFetchJson } from '../api/client';
import { useLanguage } from '../context/LanguageContext';
import {
  Database,
  Search,
  ExternalLink,
  RefreshCw,
  Trash2,
  Download,
  CheckCircle2,
  BookOpen,
  Calendar,
  Sparkles
} from 'lucide-react';

interface HistoryDashboardProps {
  onSelectClaim: (claimText: string) => void;
}

export const HistoryDashboard: React.FC<HistoryDashboardProps> = ({ onSelectClaim }) => {
  const { t } = useLanguage();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState<string>('');
  const [verdictFilter, setVerdictFilter] = useState<string>('ALL');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState<number>(15);

  // 300ms Debounce for search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    setVisibleCount(15);
  }, [debouncedSearchTerm, verdictFilter]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const loadLocalRegistry = (): HistoryItem[] => {
    try {
      const raw = localStorage.getItem('fusionx_audit_registry');
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.error('Failed to load local audit registry:', e);
      return [];
    }
  };

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const localRecords = loadLocalRegistry();
      let serverRecords: HistoryItem[] = [];

      try {
        const data = await safeFetchJson<HistoryItem[]>('/api/history');
        if (Array.isArray(data)) {
          serverRecords = data;
        }
      } catch (err) {
        console.warn('Backend history endpoint unavailable, using local registry:', err);
      }

      // Merge and deduplicate by ID / Claim
      const seenMap = new Map<string, HistoryItem>();
      
      // Local audits are prioritized first
      localRecords.forEach((item) => {
        const key = item.claim.toLowerCase().trim();
        seenMap.set(key, item);
      });

      // Then add any server-only items
      serverRecords.forEach((item) => {
        const key = item.claim.toLowerCase().trim();
        if (!seenMap.has(key)) {
          seenMap.set(key, item);
        }
      });

      const merged = Array.from(seenMap.values());
      // Sort newest first
      merged.sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());

      setHistory(merged);
    } catch (e) {
      console.error('Failed to aggregate claim history:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleClearHistory = () => {
    if (window.confirm('Are you sure you want to clear your local verification audit registry?')) {
      localStorage.removeItem('fusionx_audit_registry');
      fetchHistory();
      showToast('Audit registry log cleared.');
    }
  };

  const handleExportJSON = () => {
    try {
      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
        JSON.stringify(history, null, 2)
      )}`;
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', jsonString);
      downloadAnchor.setAttribute('download', `fusionx_audit_registry_${Date.now()}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      showToast('Exported audit registry as JSON.');
    } catch (err) {
      console.error('Failed to export JSON:', err);
    }
  };

  const filteredItems = React.useMemo(() => {
    const q = debouncedSearchTerm.toLowerCase().trim();
    return history.filter((item) => {
      const matchesSearch =
        q === '' ||
        item.claim.toLowerCase().includes(q) ||
        item.headline?.toLowerCase().includes(q) ||
        item.summary?.toLowerCase().includes(q);
      const matchesFilter =
        verdictFilter === 'ALL' || item.verdict.toLowerCase().includes(verdictFilter.toLowerCase());
      return matchesSearch && matchesFilter;
    });
  }, [history, debouncedSearchTerm, verdictFilter]);

  const displayedItems = React.useMemo(() => {
    return filteredItems.slice(0, visibleCount);
  }, [filteredItems, visibleCount]);

  const hasMoreItems = filteredItems.length > visibleCount;

  return (
    <div className="bg-white dark:bg-[#2D141E]/75 dark:backdrop-blur-2xl rounded-xl border border-stone-200 dark:border-[#E5C158]/30 p-6 shadow-editorial dark:shadow-[0_10px_30px_rgba(0,0,0,0.5),_inset_0_1px_1px_rgba(255,255,255,0.08)] space-y-6 transition-all animate-slideUp">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-100 dark:border-[#E5C158]/20">
        <div>
          <div className="flex items-center space-x-2">
            <Database className="w-5 h-5 text-stone-700 dark:text-[#E5C158]" />
            <h3 className="font-serif-editorial text-xl font-bold text-stone-900 dark:text-[#FAF6F0]">
              {t('history.title', 'Claim Registry & Investigation Archive')}
            </h3>
          </div>
          <p className="text-xs text-stone-500 dark:text-[#D4B29E] mt-0.5">
            {t('history.subtitle', 'Append-only persistent audit trail of verified claims, source citations, and confidence scores.')}
          </p>
        </div>

        <div className="flex items-center space-x-2 self-start sm:self-auto flex-wrap gap-y-2">
          <button
            onClick={fetchHistory}
            disabled={loading}
            className="px-3 py-1.5 rounded-lg border border-stone-300 dark:border-[#E5C158]/30 text-xs font-medium text-stone-700 dark:text-[#E5C158] bg-white dark:bg-[#200C12] hover:bg-stone-50 dark:hover:bg-[#4A1C2C] flex items-center space-x-1.5 transition-colors cursor-pointer shadow-xs"
            title="Refresh database records"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{t('history.refresh', 'Refresh')}</span>
          </button>

          <button
            onClick={handleExportJSON}
            disabled={history.length === 0}
            className="px-3 py-1.5 rounded-lg border border-stone-300 dark:border-[#E5C158]/30 text-xs font-medium text-stone-700 dark:text-[#E5C158] bg-white dark:bg-[#200C12] hover:bg-stone-50 dark:hover:bg-[#4A1C2C] flex items-center space-x-1.5 transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
            title="Export registry as JSON"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{t('history.exportJson', 'Export JSON')}</span>
          </button>

          <button
            onClick={handleClearHistory}
            disabled={history.length === 0}
            className="px-3 py-1.5 rounded-lg border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 text-xs font-medium flex items-center space-x-1.5 transition-colors disabled:opacity-50 cursor-pointer"
            title="Clear local audit registry"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{t('history.clearLog', 'Clear Log')}</span>
          </button>
        </div>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-700/50 text-emerald-800 dark:text-emerald-300 text-xs rounded-lg flex items-center space-x-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-stone-400 dark:text-[#E5C158]/60 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder={t('history.searchPlaceholder', 'Search claim assertions, headlines, summaries...')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-stone-300 dark:border-[#E5C158]/30 bg-white dark:bg-black/40 text-stone-900 dark:text-[#FAF6F0] placeholder-stone-400 dark:placeholder-[#E5C158]/45 focus:outline-none focus:ring-1 focus:ring-stone-800 dark:focus:ring-[#E5C158] text-xs"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto overflow-x-auto">
          <span className="text-stone-500 dark:text-[#D4B29E] font-medium">{t('history.filter', 'Filter:')}</span>
          {['ALL', 'True', 'False', 'Half True', 'Unverified'].map((v) => (
            <button
              key={v}
              onClick={() => setVerdictFilter(v)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                verdictFilter === v
                  ? 'bg-stone-900 dark:bg-gradient-to-r dark:from-[#6D1B26] dark:to-[#990033] text-white dark:text-[#E5C158] border dark:border-[#E5C158]/50 shadow-xs dark:shadow-[0_0_15px_rgba(229,193,88,0.2)] font-semibold'
                  : 'bg-stone-100 dark:bg-[#200C12] text-stone-600 dark:text-[#E5C158] hover:bg-stone-200 dark:hover:bg-[#4A1C2C] border dark:border-[#E5C158]/20'
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* History Table */}
      <div className="overflow-x-auto border border-stone-200 dark:border-[#E5C158]/25 rounded-lg">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-stone-50 dark:bg-[#200C12] border-b border-stone-200 dark:border-[#E5C158]/20 text-stone-600 dark:text-[#E5C158] font-mono uppercase tracking-wider">
              <th className="p-3">{t('history.claimCol', 'Claim Assertion & Findings')}</th>
              <th className="p-3">{t('history.inputModeCol', 'Input Mode')}</th>
              <th className="p-3">{t('history.verdictCol', 'Verdict')}</th>
              <th className="p-3">{t('history.confidenceCol', 'Confidence')}</th>
              <th className="p-3">{t('history.sourcesCol', 'Verified Sources')}</th>
              <th className="p-3">{t('history.dateCol', 'Audit Date')}</th>
              <th className="p-3 text-right">{t('history.actionCol', 'Action')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100 dark:divide-[#E5C158]/15">
            {displayedItems.map((row) => {
              const formattedDate = row.date
                ? new Date(row.date).toLocaleString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })
                : 'Recent';

              return (
                <tr key={row.id} className="hover:bg-stone-50/70 dark:hover:bg-[#4A1C2C]/30 transition-colors transform-gpu">
                  <td className="p-3 max-w-md font-serif-editorial text-stone-900 dark:text-[#FAF6F0] font-medium leading-relaxed">
                    <span className="font-bold block">"{row.claim}"</span>
                    {row.summary && (
                      <span className="block font-sans text-[11px] text-stone-500 dark:text-[#D4B29E] mt-1 line-clamp-2">
                        {row.summary}
                      </span>
                    )}
                  </td>

                  <td className="p-3 font-mono text-stone-600 dark:text-[#E5C158]/80">
                    <span className="px-2 py-0.5 rounded bg-stone-100 dark:bg-[#200C12] border border-stone-200 dark:border-[#E5C158]/30 uppercase text-[10px] font-semibold">
                      {row.input_type || 'Editorial'}
                    </span>
                  </td>

                  <td className="p-3">
                    <span
                      className="inline-block px-2.5 py-1 rounded-full font-bold text-xs whitespace-nowrap"
                      style={{
                        backgroundColor: `${row.color_code || '#6b7280'}15`,
                        color: row.color_code || '#374151',
                        border: `1px solid ${row.color_code || '#6b7280'}40`
                      }}
                    >
                      {row.verdict}
                    </span>
                  </td>

                  <td className="p-3 font-mono font-bold text-stone-800 dark:text-[#FAF6F0]">
                    {row.score ? `${Math.round(row.score * 100)}%` : '50%'}
                  </td>

                  <td className="p-3 font-sans text-stone-600 dark:text-[#D4B29E]">
                    {row.sources && row.sources.length > 0 ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-stone-100 dark:bg-[#200C12] text-stone-700 dark:text-[#FAF6F0] border dark:border-[#E5C158]/25 text-[11px] font-mono">
                        <BookOpen className="w-3 h-3 text-stone-500 dark:text-[#E5C158]" />
                        <span>{row.sources.length} cited</span>
                      </span>
                    ) : (
                      <span className="text-[11px] text-stone-400 dark:text-[#D4B29E]/60 font-mono">Archived</span>
                    )}
                  </td>

                  <td className="p-3 font-mono text-stone-500 dark:text-[#D4B29E]/70 whitespace-nowrap">
                    {formattedDate}
                  </td>

                  <td className="p-3 text-right">
                    <button
                      onClick={() => onSelectClaim(row.claim)}
                      className="px-2.5 py-1 rounded bg-stone-100 dark:bg-[#200C12] hover:bg-stone-200 dark:hover:bg-[#4A1C2C] border dark:border-[#E5C158]/30 text-stone-800 dark:text-[#E5C158] font-medium text-xs transition-colors inline-flex items-center space-x-1 shadow-xs cursor-pointer"
                      title="Re-open and verify this claim"
                    >
                      <span>{t('history.reverify', 'Re-verify')}</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filteredItems.length === 0 && (
          <div className="text-center py-12 text-stone-400 dark:text-[#D4B29E]/60 font-sans space-y-1">
            <Sparkles className="w-6 h-6 mx-auto text-stone-300 dark:text-[#E5C158]/40" />
            <p className="text-xs font-semibold text-stone-600 dark:text-[#FAF6F0]">{t('history.noRecords', 'No verification records found')}</p>
            <p className="text-[11px]">{t('history.noRecordsDesc', 'Audit claims on the Editorial Desk to build your persistent investigation registry.')}</p>
          </div>
        )}
      </div>

      {/* Pagination Bar for History */}
      {hasMoreItems && (
        <div className="flex items-center justify-between text-xs font-mono text-stone-500 dark:text-[#D4B29E] pt-2">
          <span>
            Showing {displayedItems.length} of {filteredItems.length} audit records
          </span>
          <button
            type="button"
            onClick={() => setVisibleCount((prev) => Math.min(filteredItems.length, prev + 15))}
            className="px-3 py-1.5 rounded-md bg-stone-100 dark:bg-[#200C12] text-stone-800 dark:text-[#E5C158] border border-stone-300 dark:border-[#E5C158]/30 hover:bg-stone-200 dark:hover:bg-[#4A1C2C] font-semibold cursor-pointer"
          >
            Load More Records (+{Math.min(15, filteredItems.length - visibleCount)})
          </button>
        </div>
      )}
    </div>
  );
};
