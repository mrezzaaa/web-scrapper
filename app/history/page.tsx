"use client";

import { useState, useEffect, useCallback } from "react";
import {
  History,
  Search,
  MessageSquare,
  Phone,
  MapPin,
  Tag,
  Trash2,
  X,
  RefreshCw,
  ChevronLeft,
  Database,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";

interface ContactedHistory {
  id: string;
  title: string;
  category: string | null;
  address: string | null;
  phone: string | null;
  formattedMessage: string;
  contactedAt: string;
}

interface HistoryResponse {
  history: ContactedHistory[];
  pagination: {
    total: number;
    page: number;
    totalPages: number;
    limit: number;
  };
}

export default function HistoryPage() {
  const [history, setHistory] = useState<ContactedHistory[]>([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, totalPages: 1, limit: 50 });
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [previewItem, setPreviewItem] = useState<ContactedHistory | null>(null);

  const fetchHistory = useCallback(
    async (page = 1) => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        if (searchQuery) params.set("q", searchQuery);
        params.set("page", String(page));
        params.set("limit", "50");

        const res = await fetch(`/api/history?${params.toString()}`);
        const data: HistoryResponse = await res.json();
        setHistory(data.history ?? []);
        setPagination(data.pagination ?? { total: 0, page: 1, totalPages: 1, limit: 50 });
      } catch (err) {
        console.error("Failed to fetch history:", err);
      } finally {
        setIsLoading(false);
      }
    },
    [searchQuery]
  );

  useEffect(() => {
    fetchHistory(1);
  }, [fetchHistory]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchHistory(1);
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm("Hapus riwayat ini?")) return;
    await fetch(`/api/history?id=${id}`, { method: "DELETE" });
    setHistory((prev) => prev.filter((h) => h.id !== id));
    setPagination((prev) => ({ ...prev, total: prev.total - 1 }));
  };

  const handleClearAll = async () => {
    if (!confirm("PERINGATAN: Hapus SEMUA riwayat pengiriman WA? Tindakan ini tidak bisa dibatalkan.")) return;
    await fetch("/api/history?clearAll=true", { method: "DELETE" });
    setHistory([]);
    setPagination({ total: 0, page: 1, totalPages: 1, limit: 50 });
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("id-ID", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="app-wrapper">
      {/* Header */}
      <header className="app-header">
        <div className="header-inner">
          <div className="header-brand">
            <div className="header-logo">
              <Database size={22} />
            </div>
            <div>
              <h1 className="header-title">LeadMaps</h1>
              <p className="header-subtitle">Google Maps Lead Generator</p>
            </div>
          </div>
          <nav className="header-nav">
            <Link href="/" className="header-nav-link">
              <ChevronLeft size={16} />
              <span>Dashboard</span>
            </Link>
          </nav>
        </div>
      </header>

      <main className="main-content">
        <section className="leads-section">
          {/* Section Header */}
          <div className="leads-header">
            <div className="leads-header-left">
              <div className="history-page-icon">
                <History size={22} />
              </div>
              <div>
                <h2 className="leads-title">Riwayat Pengiriman WA</h2>
                <span className="leads-count">{pagination.total} kontak tersimpan</span>
              </div>
            </div>
            <div className="leads-controls">
              {/* Search */}
              <form onSubmit={handleSearch} className="search-form">
                <div className="search-input-wrapper">
                  <Search size={14} className="search-icon" />
                  <input
                    type="text"
                    placeholder="Cari nama, lokasi..."
                    className="search-input"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </form>

              {/* Refresh */}
              <button
                type="button"
                className="btn-refresh"
                onClick={() => fetchHistory(1)}
                disabled={isLoading}
                title="Refresh"
              >
                <RefreshCw size={14} className={isLoading ? "spin" : ""} />
              </button>

              {/* Clear All */}
              {history.length > 0 && (
                <button
                  type="button"
                  className="btn-delete"
                  onClick={handleClearAll}
                  disabled={isLoading}
                  title="Hapus semua riwayat"
                  style={{ padding: "8px 12px", background: "rgba(239, 68, 68, 0.1)", marginLeft: "4px" }}
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Table or Empty State */}
          {history.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">
                <History size={40} />
              </div>
              <h3 className="empty-state-title">Belum Ada Riwayat</h3>
              <p className="empty-state-desc">
                Klik tombol <strong>"Sudah Kirim WA"</strong> di tabel lead utama untuk menyimpan riwayat pengiriman di sini.
              </p>
              <Link href="/" className="btn-go-dashboard">
                Kembali ke Dashboard
              </Link>
            </div>
          ) : (
            <div className="lead-table-wrapper">
              <div className="table-scroll">
                <table className="lead-table">
                  <thead>
                    <tr>
                      <th className="th-name">Nama Bisnis</th>
                      <th className="th-category">Kategori</th>
                      <th className="th-phone">Telepon</th>
                      <th className="th-address">Alamat</th>
                      <th className="th-date">Waktu Kirim</th>
                      <th className="th-msg">Pesan</th>
                      <th className="th-actions">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((item) => (
                      <tr key={item.id} className="lead-row">
                        <td className="td-name">
                          <div className="business-name-cell">
                            <CheckCircle2 size={13} className="sent-check-icon" />
                            <span className="business-name" title={item.title}>
                              {item.title}
                            </span>
                          </div>
                        </td>
                        <td className="td-category">
                          {item.category ? (
                            <span className="category-badge">
                              <Tag size={11} />
                              {item.category}
                            </span>
                          ) : (
                            <span className="no-data">—</span>
                          )}
                        </td>
                        <td className="td-phone">
                          {item.phone ? (
                            <a href={`tel:${item.phone}`} className="phone-link">
                              <Phone size={12} />
                              {item.phone}
                            </a>
                          ) : (
                            <span className="no-data">—</span>
                          )}
                        </td>
                        <td className="td-address">
                          {item.address ? (
                            <span className="address-text" title={item.address}>
                              <MapPin size={11} />
                              {item.address}
                            </span>
                          ) : (
                            <span className="no-data">—</span>
                          )}
                        </td>
                        <td className="td-date">
                          <span className="date-text">{formatDate(item.contactedAt)}</span>
                        </td>
                        <td className="td-msg">
                          <button
                            type="button"
                            className="btn-preview-msg"
                            onClick={() => setPreviewItem(item)}
                            title="Lihat pesan yang dikirim"
                          >
                            <MessageSquare size={13} />
                            <span>Lihat</span>
                          </button>
                        </td>
                        <td className="td-actions">
                          <div className="action-buttons">
                            <button
                              type="button"
                              className="btn-delete"
                              onClick={() => handleDeleteItem(item.id)}
                              title="Hapus riwayat ini"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="pagination">
                  {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      className={`page-btn ${p === pagination.page ? "page-btn--active" : ""}`}
                      onClick={() => fetchHistory(p)}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>
      </main>

      {/* Message Preview Modal */}
      {previewItem && (
        <div className="modal-overlay" onClick={() => setPreviewItem(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-group">
                <MessageSquare size={18} />
                <h3 className="modal-title">Pesan yang Dikirim</h3>
              </div>
              <button type="button" className="modal-close" onClick={() => setPreviewItem(null)}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <p className="modal-recipient">
                <strong>Kepada:</strong> {previewItem.title} — {previewItem.phone}
              </p>
              <p className="modal-sent-time">
                <strong>Waktu:</strong> {formatDate(previewItem.contactedAt)}
              </p>
              <div className="modal-message-box">
                <pre className="modal-message-text">{previewItem.formattedMessage}</pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
