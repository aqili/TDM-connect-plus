"use client";

import { useState, useEffect, useMemo } from "react";
import { Plus, Search, MoreVertical, Edit, Trash2, Loader2, X } from "lucide-react";
import { useSession } from "next-auth/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "react-hot-toast";

interface Certificate {
  id: string;
  name: string;
  issuer: string;
  issueDate: string;
  expiryDate: string;
  status: string;
  description: string;
  userId: string;
  createdAt: string;
}

interface AddCertificateFormData {
  name: string;
  issuer: string;
  issueDate: string;
  expiryDate: string;
  status: string;
  description: string;
}

interface EditCertificateFormData {
  name: string;
  issuer: string;
  issueDate: string;
  expiryDate: string;
  status: string;
  description: string;
}

type SortColumn = keyof Certificate;

export default function CertificatesPage() {
  const { data: session, status } = useSession();
  const [searchTerm, setSearchTerm] = useState("");
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddCertificateModalOpen, setIsAddCertificateModalOpen] = useState(false);
  const [isEditCertificateModalOpen, setIsEditCertificateModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isCreatingCertificate, setIsCreatingCertificate] = useState(false);
  const [isUpdatingCertificate, setIsUpdatingCertificate] = useState(false);
  const [isDeletingCertificate, setIsDeletingCertificate] = useState(false);
  const [selectedCertificate, setSelectedCertificate] = useState<Certificate | null>(null);
  const [formData, setFormData] = useState<AddCertificateFormData>({
    name: "",
    issuer: "",
    issueDate: "",
    expiryDate: "",
    status: "ACTIVE",
    description: "",
  });
  const [editFormData, setEditFormData] = useState<EditCertificateFormData>({
    name: "",
    issuer: "",
    issueDate: "",
    expiryDate: "",
    status: "ACTIVE",
    description: "",
  });
  const [sortColumn, setSortColumn] = useState<SortColumn>("name");
  const [sortDirection, setSortDirection] = useState("asc");

  useEffect(() => {
    const fetchCertificates = async () => {
      if (status === "loading") return;
      
      if (!session) {
        setError("Please sign in to view certificates");
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch("/api/certificates", {
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || "Failed to fetch certificates");
        }
        
        const data = await response.json();
        setCertificates(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load certificates");
      } finally {
        setIsLoading(false);
      }
    };

    fetchCertificates();
  }, [session, status]);

  const handleAddCertificate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user?.id) return;

    setIsCreatingCertificate(true);
    setError(null);

    try {
      const response = await fetch("/api/certificates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          userId: session.user.id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create certificate");
      }

      const newCertificate = await response.json();
      setCertificates(prevCertificates => [...prevCertificates, newCertificate]);
      setIsAddCertificateModalOpen(false);
      setFormData({
        name: "",
        issuer: "",
        issueDate: "",
        expiryDate: "",
        status: "ACTIVE",
        description: "",
      });
      toast.success("Certificate created successfully");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create certificate");
      toast.error(err instanceof Error ? err.message : "Failed to create certificate");
    } finally {
      setIsCreatingCertificate(false);
    }
  };

  const handleEditCertificate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCertificate) return;

    setIsUpdatingCertificate(true);
    setError(null);

    try {
      const response = await fetch(`/api/certificates/${selectedCertificate.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editFormData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update certificate");
      }

      const updatedCertificate = await response.json();
      setCertificates(prevCertificates =>
        prevCertificates.map(certificate =>
          certificate.id === selectedCertificate.id ? updatedCertificate : certificate
        )
      );
      setIsEditCertificateModalOpen(false);
      setSelectedCertificate(null);
      toast.success("Certificate updated successfully");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update certificate");
      toast.error(err instanceof Error ? err.message : "Failed to update certificate");
    } finally {
      setIsUpdatingCertificate(false);
    }
  };

  const handleDeleteCertificate = async () => {
    if (!selectedCertificate) return;

    setIsDeletingCertificate(true);
    setError(null);

    try {
      const response = await fetch(`/api/certificates/${selectedCertificate.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete certificate");
      }

      setCertificates(prevCertificates =>
        prevCertificates.filter(certificate => certificate.id !== selectedCertificate.id)
      );
      setIsDeleteModalOpen(false);
      setSelectedCertificate(null);
      toast.success("Certificate deleted successfully");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete certificate");
      toast.error(err instanceof Error ? err.message : "Failed to delete certificate");
    } finally {
      setIsDeletingCertificate(false);
    }
  };

  const openEditModal = (certificate: Certificate) => {
    setSelectedCertificate(certificate);
    setEditFormData({
      name: certificate.name,
      issuer: certificate.issuer,
      issueDate: certificate.issueDate.split('T')[0],
      expiryDate: certificate.expiryDate.split('T')[0],
      status: certificate.status,
      description: certificate.description,
    });
    setIsEditCertificateModalOpen(true);
  };

  const openDeleteModal = (certificate: Certificate) => {
    setSelectedCertificate(certificate);
    setIsDeleteModalOpen(true);
  };

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const sortedCertificates = useMemo(() => {
    return [...certificates].sort((a, b) => {
      const aValue = a[sortColumn];
      const bValue = b[sortColumn];
      if (sortDirection === "asc") {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });
  }, [certificates, sortColumn, sortDirection]);

  const filteredCertificates = useMemo(() => {
    return sortedCertificates.filter(certificate =>
      Object.values(certificate).some(value =>
        String(value).toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [sortedCertificates, searchTerm]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-100 text-green-800";
      case "EXPIRED":
        return "bg-red-100 text-red-800";
      case "REVOKED":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Certificates</h1>
        <Button
          onClick={() => setIsAddCertificateModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Certificate
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
        <Input
          placeholder="Search certificates..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead
                className="cursor-pointer"
                onClick={() => handleSort("name")}
              >
                Name {sortColumn === "name" && (sortDirection === "asc" ? "↑" : "↓")}
              </TableHead>
              <TableHead
                className="cursor-pointer"
                onClick={() => handleSort("issuer")}
              >
                Issuer {sortColumn === "issuer" && (sortDirection === "asc" ? "↑" : "↓")}
              </TableHead>
              <TableHead
                className="cursor-pointer"
                onClick={() => handleSort("issueDate")}
              >
                Issue Date {sortColumn === "issueDate" && (sortDirection === "asc" ? "↑" : "↓")}
              </TableHead>
              <TableHead
                className="cursor-pointer"
                onClick={() => handleSort("expiryDate")}
              >
                Expiry Date {sortColumn === "expiryDate" && (sortDirection === "asc" ? "↑" : "↓")}
              </TableHead>
              <TableHead
                className="cursor-pointer"
                onClick={() => handleSort("status")}
              >
                Status {sortColumn === "status" && (sortDirection === "asc" ? "↑" : "↓")}
              </TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCertificates.map((certificate) => (
              <TableRow key={certificate.id}>
                <TableCell>{certificate.name}</TableCell>
                <TableCell>{certificate.issuer}</TableCell>
                <TableCell>{new Date(certificate.issueDate).toLocaleDateString()}</TableCell>
                <TableCell>{new Date(certificate.expiryDate).toLocaleDateString()}</TableCell>
                <TableCell>
                  <Badge className={getStatusColor(certificate.status)}>
                    {certificate.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditModal(certificate)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openDeleteModal(certificate)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Add Certificate Modal */}
      {isAddCertificateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white dark:bg-neutral-800 rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Add Certificate</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsAddCertificateModalOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <form onSubmit={handleAddCertificate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <Input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Issuer</label>
                <Input
                  type="text"
                  value={formData.issuer}
                  onChange={(e) => setFormData({ ...formData, issuer: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Issue Date</label>
                <Input
                  type="date"
                  value={formData.issueDate}
                  onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Expiry Date</label>
                <Input
                  type="date"
                  value={formData.expiryDate}
                  onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                >
                  <option value="ACTIVE">Active</option>
                  <option value="EXPIRED">Expired</option>
                  <option value="REVOKED">Revoked</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <Input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                />
              </div>
              <Button
                type="submit"
                disabled={isCreatingCertificate}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {isCreatingCertificate ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Creating...
                  </>
                ) : (
                  "Create Certificate"
                )}
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Certificate Modal */}
      {isEditCertificateModalOpen && selectedCertificate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white dark:bg-neutral-800 rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Edit Certificate</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsEditCertificateModalOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <form onSubmit={handleEditCertificate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <Input
                  type="text"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Issuer</label>
                <Input
                  type="text"
                  value={editFormData.issuer}
                  onChange={(e) => setEditFormData({ ...editFormData, issuer: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Issue Date</label>
                <Input
                  type="date"
                  value={editFormData.issueDate}
                  onChange={(e) => setEditFormData({ ...editFormData, issueDate: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Expiry Date</label>
                <Input
                  type="date"
                  value={editFormData.expiryDate}
                  onChange={(e) => setEditFormData({ ...editFormData, expiryDate: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <select
                  value={editFormData.status}
                  onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                >
                  <option value="ACTIVE">Active</option>
                  <option value="EXPIRED">Expired</option>
                  <option value="REVOKED">Revoked</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <Input
                  type="text"
                  value={editFormData.description}
                  onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                  required
                />
              </div>
              <Button
                type="submit"
                disabled={isUpdatingCertificate}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {isUpdatingCertificate ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Updating...
                  </>
                ) : (
                  "Update Certificate"
                )}
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {isDeleteModalOpen && selectedCertificate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white dark:bg-neutral-800 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">Delete Certificate</h2>
            <p className="mb-4">
              Are you sure you want to delete the certificate "{selectedCertificate.name}"?
            </p>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setIsDeleteModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteCertificate}
                disabled={isDeletingCertificate}
              >
                {isDeletingCertificate ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Deleting...
                  </>
                ) : (
                  "Delete"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 