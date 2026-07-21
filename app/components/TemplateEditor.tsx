"use client";

import { useState } from "react";
import { MessageSquare, Save, RotateCcw, Edit2 } from "lucide-react";

interface TemplateEditorProps {
  template: string;
  onSave: (template: string) => void;
  defaultTemplate: string;
}

export default function TemplateEditor({ template, onSave, defaultTemplate }: TemplateEditorProps) {
  const [currentTemplate, setCurrentTemplate] = useState(template);
  const [isEditing, setIsEditing] = useState(false);

  const handleSave = () => {
    onSave(currentTemplate);
    setIsEditing(false);
  };

  const handleReset = () => {
    setCurrentTemplate(defaultTemplate);
    onSave(defaultTemplate);
  };

  return (
    <div className="template-editor-card">
      <div className="template-editor-header">
        <div className="template-header-left">
          <div className="template-icon-wrapper">
            <MessageSquare size={16} />
          </div>
          <h3 className="template-title">Template Pesan WhatsApp</h3>
        </div>
        <button 
          className="btn-edit-template"
          onClick={() => setIsEditing(!isEditing)}
        >
          {isEditing ? "Batal" : (
            <>
              <Edit2 size={12} />
              <span>Edit Template</span>
            </>
          )}
        </button>
      </div>

      {isEditing ? (
        <div className="template-editor-body">
          <p className="template-help">
            Gunakan <code>{`{name}`}</code> untuk menyisipkan nama bisnis secara otomatis.
          </p>
          <textarea
            className="template-textarea"
            value={currentTemplate}
            onChange={(e) => setCurrentTemplate(e.target.value)}
            rows={7}
          />
          <div className="template-actions">
            <button className="btn-reset" onClick={handleReset}>
              <RotateCcw size={14} />
              Reset
            </button>
            <button className="btn-save" onClick={handleSave}>
              <Save size={14} />
              Simpan
            </button>
          </div>
        </div>
      ) : (
        <div className="template-preview">
          <pre className="template-text">{currentTemplate.replace('{name}', '[Nama Bisnis]')}</pre>
        </div>
      )}
    </div>
  );
}
