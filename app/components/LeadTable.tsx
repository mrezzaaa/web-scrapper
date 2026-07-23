"use client";

import { useState } from "react";
import {
  Globe,
  Phone,
  MapPin,
  Star,
  MessageCircle,
  Trash2,
  ExternalLink,
  Tag,
  Building2,
  CheckCircle2,
} from "lucide-react";

export interface Lead {
  id: string;
  title: string;
  category: string | null;
  address: string | null;
  phone: string | null;
  website: string | null;
  hasWebsite: boolean;
  rating: number | null;
  locationQuery: string;
  createdAt: string;
}

interface LeadTableProps {
  leads: Lead[];
  onDelete: (id: string) => void;
  whatsappTemplate: string;
}

/**
 * Converts Indonesian phone number to WhatsApp format.
 * "08123456789" → "628123456789"
 * "+628123456789" → "628123456789"
 */
function toWhatsAppNumber(phone: string): string {
  const cleaned = phone.replace(/[\s\-().+]/g, "");
  if (cleaned.startsWith("08")) {
    return "62" + cleaned.slice(1);
  }
  if (cleaned.startsWith("628")) {
    return cleaned;
  }
  if (cleaned.startsWith("8")) {
    return "62" + cleaned;
  }
  return cleaned;
}

/**
 * Creates a WhatsApp direct message link with a pre-filled pitch message.
 */
function buildWhatsAppLink(phone: string, businessName: string, template: string): string {
  const waNumber = toWhatsAppNumber(phone);
  const message = encodeURIComponent(
    template.replace(/{name}/g, businessName)
  );
  return `https://wa.me/${waNumber}?text=${message}`;
}

/**
 * Renders star rating display.
 */
function StarRating({ rating }: { rating: number | null }) {
  if (!rating) return <span className="no-data">—</span>;
  return (
    <div className="star-rating">
      <Star size={13} className="star-icon" />
      <span>{rating.toFixed(1)}</span>
    </div>
  );
}

export default function LeadTable({ leads, onDelete, whatsappTemplate }: LeadTableProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [sentIds, setSentIds] = useState<Set<string>>(new Set());
  const [savingId, setSavingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus lead ini?")) return;
    setDeletingId(id);
    try {
      await fetch(`/api/leads?id=${id}`, { method: "DELETE" });
      onDelete(id);
    } finally {
      setDeletingId(null);
    }
  };

  const handleMarkSent = async (lead: Lead) => {
    if (sentIds.has(lead.id)) return; // already saved
    setSavingId(lead.id);
    try {
      const formattedMessage = whatsappTemplate.replace(/{name}/g, lead.title);
      const res = await fetch("/api/history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          originalLeadId: lead.id,
          title: lead.title,
          category: lead.category,
          address: lead.address,
          phone: lead.phone,
          formattedMessage,
        }),
      });
      if (res.ok) {
        setSentIds((prev) => new Set(prev).add(lead.id));
      }
    } catch (err) {
      console.error("Failed to save history:", err);
    } finally {
      setSavingId(null);
    }
  };

  if (leads.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">
          <Building2 size={40} />
        </div>
        <h3 className="empty-state-title">Belum Ada Data Lead</h3>
        <p className="empty-state-desc">
          Gunakan form di atas untuk mulai scraping Google Maps dan temukan UMKM potensial tanpa
          website.
        </p>
      </div>
    );
  }

  return (
    <div className="lead-table-wrapper">
      <div className="table-scroll">
        <table className="lead-table">
          <thead>
            <tr>
              <th className="th-name">Nama Bisnis</th>
              <th className="th-category">Kategori</th>
              <th className="th-address">Alamat</th>
              <th className="th-phone">Telepon</th>
              <th className="th-rating">Rating</th>
              <th className="th-website">Website</th>
              <th className="th-actions">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => (
              <tr key={lead.id} className="lead-row">
                {/* Name */}
                <td className="td-name">
                  <div className="business-name">{lead.title}</div>
                  <div className="location-query">
                    <MapPin size={10} />
                    {lead.locationQuery}
                  </div>
                </td>

                {/* Category */}
                <td className="td-category" data-label="Kategori">
                  {lead.category ? (
                    <span className="category-badge">
                      <Tag size={11} />
                      {lead.category}
                    </span>
                  ) : (
                    <span className="no-data">—</span>
                  )}
                </td>

                {/* Address */}
                <td className="td-address" data-label="Alamat">
                  {lead.address ? (
                    <span className="address-text" title={lead.address}>
                      {lead.address}
                    </span>
                  ) : (
                    <span className="no-data">—</span>
                  )}
                </td>

                {/* Phone */}
                <td className="td-phone" data-label="Telepon">
                  {lead.phone ? (
                    <a href={`tel:${lead.phone}`} className="phone-link">
                      <Phone size={12} />
                      {lead.phone}
                    </a>
                  ) : (
                    <span className="no-data">—</span>
                  )}
                </td>

                {/* Rating */}
                <td className="td-rating" data-label="Rating">
                  <StarRating rating={lead.rating} />
                </td>

                {/* Website Status Badge */}
                <td className="td-website" data-label="Website">
                  {lead.hasWebsite && lead.website ? (
                    <a
                      href={lead.website.startsWith("/") ? `https://www.google.com${lead.website}` : lead.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="website-badge website-badge--has"
                    >
                      <Globe size={11} />
                      Ada Website
                      <ExternalLink size={10} />
                    </a>
                  ) : (
                    <span className="website-badge website-badge--none">
                      <Globe size={11} />
                      Tanpa Website
                    </span>
                  )}
                </td>

                {/* Actions */}
                <td className="td-actions">
                  <div className="action-buttons">
                    {/* WhatsApp Button */}
                    {lead.phone && !lead.hasWebsite && (
                      <a
                        id={`btn-wa-${lead.id}`}
                        href={buildWhatsAppLink(lead.phone, lead.title, whatsappTemplate)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-whatsapp"
                        title={`Hubungi ${lead.title} via WhatsApp`}
                      >
                        <MessageCircle size={14} />
                        <span>WA</span>
                      </a>
                    )}
                    {lead.phone && lead.hasWebsite && (
                      <a
                        id={`btn-wa-${lead.id}`}
                        href={buildWhatsAppLink(lead.phone, lead.title, whatsappTemplate)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-whatsapp btn-whatsapp--secondary"
                        title={`Hubungi ${lead.title} via WhatsApp`}
                      >
                        <MessageCircle size={14} />
                      </a>
                    )}

                    {/* Sudah Kirim WA Button — only if phone exists */}
                    {lead.phone && (
                      <button
                        id={`btn-sent-${lead.id}`}
                        type="button"
                        className={`btn-mark-sent ${sentIds.has(lead.id) ? "btn-mark-sent--done" : ""}`}
                        onClick={() => handleMarkSent(lead)}
                        disabled={sentIds.has(lead.id) || savingId === lead.id}
                        title={sentIds.has(lead.id) ? "Sudah tersimpan di riwayat" : "Tandai sebagai sudah kirim WA"}
                      >
                        <CheckCircle2 size={14} />
                        <span>{sentIds.has(lead.id) ? "Terkirim" : "Sudah Kirim"}</span>
                      </button>
                    )}

                    {/* Delete Button */}
                    <button
                      id={`btn-delete-${lead.id}`}
                      className="btn-delete"
                      onClick={() => handleDelete(lead.id)}
                      disabled={deletingId === lead.id}
                      title="Hapus lead"
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
    </div>
  );
}
