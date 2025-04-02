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
import { format } from "date-fns";
import { toast } from "react-hot-toast";

interface Vacation {
  id: string;
  userId: string;
  type: string;
  startDate: string;
  endDate: string;
  status: string;
  description: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
  };
}

interface AddVacationFormData {
  type: string;
  startDate: string;
  endDate: string;
  description: string;
}

interface EditVacationFormData {
  type: string;
  startDate: string;
  endDate: string;
  description: string;
  status: string;
}

type SortColumn = keyof Vacation;

export default function VacationsPage() {
  const { data: session, status } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";
  const [searchTerm, setSearchTerm] = useState("");
  const [vacations, setVacations] = useState<Vacation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedVacation, setSelectedVacation] = useState<Vacation | null>(null);
  const [formData, setFormData] = useState<AddVacationFormData>({
    type: "ANNUAL",
    startDate: "",
    endDate: "",
    description: ""
  });
  const [editFormData, setEditFormData] = useState<EditVacationFormData>({
    type: "ANNUAL",
    startDate: "",
    endDate: "",
    description: "",
    status: "PENDING"
  });
  const [sortColumn, setSortColumn] = useState<SortColumn>("startDate");
  const [sortDirection, setSortDirection] = useState("asc");

  useEffect(() => {
    const fetchVacations = async () => {
      if (status === "loading") return;
      
      if (!session) {
        setError("Please sign in to view vacations");
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch("/api/vacations", {
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || "Failed to fetch vacations");
        }
        
        const data = await response.json();
        setVacations(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load vacations");
      } finally {
        setIsLoading(false);
      }
    };

    fetchVacations();
  }, [session, status]);

  const handleAddVacation = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    setError(null);

    try {
      // Format dates to ISO string format
      const formattedData = {
        ...formData,
        startDate: new Date(formData.startDate).toISOString(),
        endDate: new Date(formData.endDate).toISOString(),
      };

      const response = await fetch("/api/vacations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formattedData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create vacation");
      }

      const newVacation = await response.json();
      setVacations(prevVacations => [...prevVacations, newVacation]);
      setIsAddModalOpen(false);
      setFormData({
        type: "ANNUAL",
        startDate: "",
        endDate: "",
        description: ""
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create vacation");
    } finally {
      setIsCreating(false);
    }
  };

  const handleEditVacation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVacation) return;

    setIsUpdating(true);
    setError(null);

    try {
      const response = await fetch(`/api/vacations/${selectedVacation.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editFormData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update vacation");
      }

      const updatedVacation = await response.json();
      setVacations(prevVacations => 
        prevVacations.map(vacation => 
          vacation.id === selectedVacation.id ? updatedVacation : vacation
        )
      );
      setIsEditModalOpen(false);
      setSelectedVacation(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update vacation");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteVacation = async () => {
    if (!selectedVacation) return;

    setIsDeleting(true);
    setError(null);

    try {
      const response = await fetch(`/api/vacations/${selectedVacation.id}`, {
        method: "DELETE",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to delete vacation");
      }

      setVacations(prevVacations => 
        prevVacations.filter(vacation => vacation.id !== selectedVacation.id)
      );
      setIsDeleteModalOpen(false);
      setSelectedVacation(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete vacation");
    } finally {
      setIsDeleting(false);
    }
  };

  const openEditModal = (vacation: Vacation) => {
    if (!isAdmin && vacation.userId !== session?.user?.id) {
      toast.error("You can only edit your own vacation requests");
      return;
    }
    setSelectedVacation(vacation);
    setEditFormData({
      type: vacation.type,
      startDate: vacation.startDate.split('T')[0],
      endDate: vacation.endDate.split('T')[0],
      description: vacation.description || "",
      status: vacation.status,
    });
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (vacation: Vacation) => {
    if (!isAdmin && vacation.userId !== session?.user?.id) {
      toast.error("You can only delete your own vacation requests");
      return;
    }
    setSelectedVacation(vacation);
    setIsDeleteModalOpen(true);
  };

  const filteredVacations = useMemo(() => {
    return vacations.filter((vacation) =>
      vacation.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vacation.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vacation.status.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [vacations, searchTerm]);

  const sortedVacations = useMemo(() => {
    return filteredVacations.sort((a, b) => {
      const aValue = a[sortColumn] || "";
      const bValue = b[sortColumn] || "";
      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredVacations, sortColumn, sortDirection]);

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "APPROVED":
        return "bg-green-100 text-green-800";
      case "REJECTED":
        return "bg-red-100 text-red-800";
      case "CANCELLED":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Vacations</h1>
        <Button 
          onClick={() => setIsAddModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Vacation
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
            <Input
              type="text"
              placeholder="Search vacations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {error && (
          <div className="bg-red-50 text-red-500 p-4 rounded-md mb-4">
            {error}
          </div>
        )}

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead
                  className="cursor-pointer"
                  onClick={() => handleSort("user")}
                >
                  Employee {sortColumn === "user" && (sortDirection === "asc" ? "↑" : "↓")}
                </TableHead>
                <TableHead
                  className="cursor-pointer"
                  onClick={() => handleSort("type")}
                >
                  Type {sortColumn === "type" && (sortDirection === "asc" ? "↑" : "↓")}
                </TableHead>
                <TableHead
                  className="cursor-pointer"
                  onClick={() => handleSort("startDate")}
                >
                  Start Date {sortColumn === "startDate" && (sortDirection === "asc" ? "↑" : "↓")}
                </TableHead>
                <TableHead
                  className="cursor-pointer"
                  onClick={() => handleSort("endDate")}
                >
                  End Date {sortColumn === "endDate" && (sortDirection === "asc" ? "↑" : "↓")}
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
              {sortedVacations.map((vacation) => (
                <TableRow key={vacation.id}>
                  <TableCell>{vacation.user.name}</TableCell>
                  <TableCell>{vacation.type}</TableCell>
                  <TableCell>{format(new Date(vacation.startDate), "MMMM d, yyyy")}</TableCell>
                  <TableCell>{format(new Date(vacation.endDate), "MMMM d, yyyy")}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(vacation.status)}>
                      {vacation.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {(isAdmin || vacation.userId === session?.user?.id) && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditModal(vacation)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openDeleteModal(vacation)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Add Vacation Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Add New Vacation</h2>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddVacation} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                >
                  <option value="ANNUAL">Annual</option>
                  <option value="SICK">Sick</option>
                  <option value="MATERNITY">Maternity</option>
                  <option value="PATERNITY">Paternity</option>
                  <option value="UNPAID">Unpaid</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Start Date</label>
                <Input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">End Date</label>
                <Input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  required
                />
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
              <div className="flex justify-end gap-3 mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isCreating}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Creating...
                    </>
                  ) : (
                    'Create Vacation'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Vacation Modal */}
      {isEditModalOpen && selectedVacation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Edit Vacation</h2>
              <button
                onClick={() => {
                  setIsEditModalOpen(false);
                  setSelectedVacation(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleEditVacation} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Type</label>
                <select
                  value={editFormData.type}
                  onChange={(e) => setEditFormData({ ...editFormData, type: e.target.value })}
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                >
                  <option value="ANNUAL">Annual</option>
                  <option value="SICK">Sick</option>
                  <option value="MATERNITY">Maternity</option>
                  <option value="PATERNITY">Paternity</option>
                  <option value="UNPAID">Unpaid</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Start Date</label>
                <Input
                  type="date"
                  value={editFormData.startDate}
                  onChange={(e) => setEditFormData({ ...editFormData, startDate: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">End Date</label>
                <Input
                  type="date"
                  value={editFormData.endDate}
                  onChange={(e) => setEditFormData({ ...editFormData, endDate: e.target.value })}
                  required
                />
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
              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <select
                  value={editFormData.status}
                  onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                >
                  <option value="PENDING">Pending</option>
                  <option value="APPROVED">Approved</option>
                  <option value="REJECTED">Rejected</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setSelectedVacation(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isUpdating}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isUpdating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Updating...
                    </>
                  ) : (
                    'Update Vacation'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Vacation Modal */}
      {isDeleteModalOpen && selectedVacation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Delete Vacation</h2>
              <button
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setSelectedVacation(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this vacation request? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setSelectedVacation(null);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleDeleteVacation}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Deleting...
                  </>
                ) : (
                  'Delete Vacation'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 