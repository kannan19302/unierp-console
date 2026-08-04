"use client";
import { useState, useEffect, useCallback } from "react";
import { PageHeader, Button, DataTable, Modal, useToast } from "@unerp/ui";
import { RouteGuard } from "@unerp/framework";
import { Upload, CheckCircle, XCircle } from "lucide-react";
import type { Column } from "@unerp/ui";

interface Submission {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  status: string;
  submissionNotes: string | null;
  createdAt: string;
}

export default function SubmissionsPage() {
  const { toast } = useToast();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    category: "",
    icon: "",
  });

  const fetchSubmissions = useCallback(async () => {
    const res = await fetch("/api/v1/marketplace/submissions");
    if (res.ok) setSubmissions(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  const handleCreate = async () => {
    const res = await fetch("/api/v1/marketplace/submissions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      toast({ title: "Submission created", variant: "success" });
      setShowCreate(false);
      setForm({ name: "", slug: "", description: "", category: "", icon: "" });
      await fetchSubmissions();
    } else toast({ title: "Failed to create submission", variant: "error" });
  };

  const handleReview = async (id: string, action: "APPROVED" | "REJECTED") => {
    const endpoint = action === "APPROVED" ? "approve" : "reject";
    const res = await fetch(
      `/api/v1/marketplace/submissions/${id}/${endpoint}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: `Reviewed: ${action}` }),
      },
    );
    if (res.ok) {
      toast({
        title: `Submission ${action.toLowerCase()}`,
        variant: "success",
      });
      await fetchSubmissions();
    } else toast({ title: "Failed to review submission", variant: "error" });
  };

  const columns: Column<Submission>[] = [
    { key: "name", header: "Name", render: (r) => r.name },
    {
      key: "category",
      header: "Category",
      render: (r) => <span className="ui-badge">{r.category}</span>,
    },
    {
      key: "status",
      header: "Status",
      render: (r) => {
        const cls =
          r.status === "APPROVED"
            ? "ui-badge-success"
            : r.status === "REJECTED"
              ? "ui-badge-danger"
              : "ui-badge-info";
        return <span className={`ui-badge ${cls}`}>{r.status}</span>;
      },
    },
    {
      key: "createdAt",
      header: "Submitted",
      render: (r) => new Date(r.createdAt).toLocaleDateString(),
    },
    {
      key: "submissionNotes",
      header: "Notes",
      render: (r) => r.submissionNotes ?? "-",
    },
    {
      key: "actions",
      header: "Actions",
      render: (r) =>
        r.status === "PENDING" ? (
          <div className="ui-flex-row ui-gap-2">
            <Button
              size="sm"
              variant="ghost"
              leftIcon={<CheckCircle size={14} />}
              onClick={(e) => {
                e.stopPropagation();
                handleReview(r.id, "APPROVED");
              }}
            >
              Approve
            </Button>
            <Button
              size="sm"
              variant="ghost"
              leftIcon={<XCircle size={14} />}
              onClick={(e) => {
                e.stopPropagation();
                handleReview(r.id, "REJECTED");
              }}
            >
              Reject
            </Button>
          </div>
        ) : (
          <span className="u-text-muted">-</span>
        ),
    },
  ];

  return (
    <RouteGuard permission="marketplace.submission.read">
      <div className="ui-stack-6">
        <PageHeader
          title="Developer Submissions"
          description="Review and approve marketplace app submissions."
          breadcrumbs={[
            { label: "Apps", href: "/apps" },
            { label: "Marketplace", href: "/marketplace" },
            { label: "Submissions" },
          ]}
        />
        <div>
          <Button
            leftIcon={<Upload size={16} />}
            onClick={() => setShowCreate(true)}
          >
            New Submission
          </Button>
        </div>
        <DataTable columns={columns} data={submissions} loading={loading} />
        <Modal
          open={showCreate}
          onClose={() => setShowCreate(false)}
          title="New Developer Submission"
        >
          <div className="ui-form-group">
            {["name", "slug", "description", "category", "icon"].map((f) => (
              <div key={f} className="ui-form-group">
                <label className="ui-label">
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </label>
                <input
                  className="ui-input"
                  value={(form as Record<string, string>)[f]}
                  onChange={(e) => setForm({ ...form, [f]: e.target.value })}
                  placeholder={f}
                />
              </div>
            ))}
            <div className="ui-flex-row ui-gap-4 u-mt-4">
              <Button
                onClick={handleCreate}
                disabled={!form.name || !form.slug}
              >
                Submit
              </Button>
              <Button variant="ghost" onClick={() => setShowCreate(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </RouteGuard>
  );
}
