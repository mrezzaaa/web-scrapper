"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  BarChart3,
  Globe,
  GlobeLock,
  RefreshCw,
  Search,
  Filter,
  Database,
  Trash2,
  History,
} from "lucide-react";
import ScrapeForm from "./components/ScrapeForm";
import LeadTable, { Lead } from "./components/LeadTable";
import TemplateEditor from "./components/TemplateEditor";
import Link from "next/link";

const DEFAULT_WA_TEMPLATE = `Halo {name}! \n\nSaya ingin menawarkan jasa pembuatan website profesional untuk bisnis Anda.\n\nDengan website, bisnis Anda akan:\n- *Lebih mudah* ditemukan calon pelanggan\n- Terlihat lebih *profesional & terpercaya*\n- Bisa berjualan *online 24 jam*\n\nHarga mulai dari *Rp 1.500.000,-* dengan tampilan modern dan mobile-friendly.\n\nBoleh kita diskusi lebih lanjut?`;

interface LeadsResponse {
  leads: Lead[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

interface Stats {
  total: number;
  withWebsite: number;
  withoutWebsite: number;
}

export default function Home() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, withWebsite: 0, withoutWebsite: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterWebsite, setFilterWebsite] = useState<"all" | "true" | "false">("all");
  const [pagination, setPagination] = useState({ total: 0, page: 1, totalPages: 1, limit: 50 });
  const [whatsappTemplate, setWhatsappTemplate] = useState(DEFAULT_WA_TEMPLATE);

  const fetchLeads = useCallback(
    async (page = 1) => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        if (filterWebsite !== "all") params.set("hasWebsite", filterWebsite);
        if (searchQuery) params.set("q", searchQuery);
        params.set("page", String(page));
        params.set("limit", "50");

        const res = await fetch(`/api/leads?${params.toString()}`);
        const data: LeadsResponse = await res.json();

        setLeads(data.leads ?? []);
        setPagination(data.pagination ?? { total: 0, page: 1, totalPages: 1, limit: 50 });
      } catch (err) {
        console.error("Failed to fetch leads:", err);
      } finally {
        setIsLoading(false);
      }
    },
    [filterWebsite, searchQuery]
  );

  const fetchStats = useCallback(async () => {
    try {
      const [allRes, noWebRes] = await Promise.all([
        fetch("/api/leads?limit=1"),
        fetch("/api/leads?hasWebsite=false&limit=1"),
      ]);
      const allData: LeadsResponse = await allRes.json();
      const noWebData: LeadsResponse = await noWebRes.json();

      const total = allData.pagination?.total ?? 0;
      const withoutWebsite = noWebData.pagination?.total ?? 0;
      setStats({ total, withoutWebsite, withWebsite: total - withoutWebsite });
    } catch {
      // silently fail
    }
  }, []);

  const fetchTemplate = useCallback(async () => {
    try {
      const res = await fetch("/api/settings?key=whatsappTemplate");
      if (res.ok) {
        const data = await res.json();
        if (data.value) setWhatsappTemplate(data.value);
      }
    } catch (err) {
      console.error("Failed to fetch template:", err);
    }
  }, []);

  useEffect(() => {
    fetchTemplate();
    fetchLeads(1);
    fetchStats();
  }, [fetchLeads, fetchStats, fetchTemplate]);

  const handleScrapeComplete = () => {
    fetchLeads(1);
    fetchStats();
  };

  // Scroll to leads section when page changes (skip first render)
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    document.getElementById("leads-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [pagination.page]);

  const handleDelete = (id: string) => {
    setLeads((prev) => prev.filter((l) => l.id !== id));
    setStats((prev) => ({ ...prev, total: prev.total - 1 }));
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLeads(1);
  };

  const handleClearAll = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!confirm("PERINGATAN: Apakah Anda yakin ingin menghapus SEMUA data lead dari database? Tindakan ini tidak bisa dibatalkan.")) {
      return;
    }
    
    setIsLoading(true);
    try {
      await fetch("/api/leads?clearAll=true", { method: "DELETE" });
      fetchLeads(1);
      fetchStats();
    } catch (err) {
      console.error("Gagal menghapus data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveTemplate = async (template: string) => {
    setWhatsappTemplate(template);
    try {
      await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "whatsappTemplate", value: template }),
      });
    } catch (err) {
      console.error("Failed to save template:", err);
    }
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
              <h1 className="header-title">Lead Maps</h1>
              <p className="header-subtitle">Google Maps Lead Generator</p>
            </div>
          </div>
          <div className="header-meta">
            <Link href="/history" className="header-nav-link">
              <History size={16} />
              <span>Riwayat WA</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="app-main">
        {/* Stats Cards */}
        <section className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon stat-icon--total">
              <BarChart3 size={20} />
            </div>
            <div className="stat-body">
              <div className="stat-value">{stats.total.toLocaleString("id-ID")}</div>
              <div className="stat-label">Total Lead</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon stat-icon--no-web">
              <GlobeLock size={20} />
            </div>
            <div className="stat-body">
              <div className="stat-value stat-value--accent">
                {stats.withoutWebsite.toLocaleString("id-ID")}
              </div>
              <div className="stat-label">Tanpa Website</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon stat-icon--web">
              <Globe size={20} />
            </div>
            <div className="stat-body">
              <div className="stat-value">{stats.withWebsite.toLocaleString("id-ID")}</div>
              <div className="stat-label">Punya Website</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon stat-icon--pct">
              <BarChart3 size={20} />
            </div>
            <div className="stat-body">
              <div className="stat-value">
                {stats.total > 0
                  ? Math.round((stats.withoutWebsite / stats.total) * 100)
                  : 0}
                %
              </div>
              <div className="stat-label">Peluang Prospek</div>
            </div>
          </div>
        </section>

        {/* Scrape Form & Template Editor */}
        <section className="form-sections-grid">
          <ScrapeForm onScrapeComplete={handleScrapeComplete} />
          <TemplateEditor 
            template={whatsappTemplate}
            onSave={handleSaveTemplate}
            defaultTemplate={DEFAULT_WA_TEMPLATE}
          />
        </section>

        {/* Leads Table Section */}
        <section className="leads-section" id="leads-section">
          {/* Section Header & Filters */}
          <div className="leads-header">
            <div className="leads-header-left">
              <h2 className="leads-title">Database Lead</h2>
              <span className="leads-count">{pagination.total} leads</span>
            </div>
            <div className="leads-controls">
              {/* Search */}
              <form onSubmit={handleSearch} className="search-form">
                <div className="search-input-wrapper">
                  <Search size={14} className="search-icon" />
                  <input
                    id="input-search-leads"
                    type="text"
                    placeholder="Cari nama, lokasi..."
                    className="search-input"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </form>

              {/* Filter */}
              <div className="filter-wrapper">
                <Filter size={14} className="filter-icon" />
                <select
                  id="select-filter-website"
                  className="filter-select"
                  value={filterWebsite}
                  onChange={(e) =>
                    setFilterWebsite(e.target.value as "all" | "true" | "false")
                  }
                >
                  <option value="all">Semua</option>
                  <option value="false">Tanpa Website</option>
                  <option value="true">Ada Website</option>
                </select>
              </div>

              {/* Refresh */}
              <button
                type="button"
                id="btn-refresh-leads"
                className="btn-refresh"
                onClick={() => fetchLeads(1)}
                disabled={isLoading}
                title="Refresh data"
              >
                <RefreshCw size={14} className={isLoading ? "spin" : ""} />
              </button>
              
              {/* Clear All */}
              <button
                type="button"
                id="btn-clear-all"
                className="btn-delete"
                onClick={handleClearAll}
                disabled={isLoading || leads.length === 0}
                title="Hapus semua lead"
                style={{ padding: "8px 12px", background: "rgba(239, 68, 68, 0.1)", marginLeft: "4px" }}
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>

          {/* Table */}
          <LeadTable leads={leads} onDelete={handleDelete} whatsappTemplate={whatsappTemplate} />

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="pagination">
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  id={`btn-page-${p}`}
                  className={`page-btn ${p === pagination.page ? "page-btn--active" : ""}`}
                  onClick={() => fetchLeads(p)}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </section>
      </main>

      <footer className="app-footer">
        <p>LeadMaps © 2025 · Dibuat untuk membantu bisnis digital Indonesia</p>
      </footer>
    </div>
  );
}
