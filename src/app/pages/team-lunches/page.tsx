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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { format } from "date-fns";
import { toast } from "react-hot-toast";

interface TeamLunch {
  id: string;
  month: string;
  suggestedDate: string;
  status: string;
  organizer1: {
    id: string;
    name: string;
  };
  organizer2: {
    id: string;
    name: string;
  };
  createdAt: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  portfolio: string | null;
}

interface AddTeamLunchFormData {
  month: string;
  suggestedDate: string;
  organizer1Id: string;
  organizer2Id: string;
  status: string;
}

interface EditTeamLunchFormData extends AddTeamLunchFormData {
  id: string;
}

type SortColumn = keyof TeamLunch;

export default function TeamLunchesPage() {
  const { data: session, status } = useSession();
  const [searchTerm, setSearchTerm] = useState("");
  const [teamLunches, setTeamLunches] = useState<TeamLunch[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedTeamLunch, setSelectedTeamLunch] = useState<TeamLunch | null>(null);
  const [formData, setFormData] = useState<AddTeamLunchFormData>({
    month: "",
    suggestedDate: "",
    organizer1Id: "",
    organizer2Id: "",
    status: "NEW"
  });
  const [editFormData, setEditFormData] = useState<EditTeamLunchFormData>({
    month: "",
    suggestedDate: "",
    organizer1Id: "",
    organizer2Id: "",
    status: "NEW",
    id: ""
  });
  const [sortColumn, setSortColumn] = useState<SortColumn>("month");
  const [sortDirection, setSortDirection] = useState("asc");

  const isAdmin = session?.user?.role === "ADMIN";

  useEffect(() => {
    const fetchTeamLunches = async () => {
      if (status === "loading") return;
      
      if (!session) {
        setError("Please sign in to view team lunches");
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch("/api/team-lunches", {
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || "Failed to fetch team lunches");
        }
        
        const data = await response.json();
        setTeamLunches(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load team lunches");
      } finally {
        setIsLoading(false);
      }
    };

    fetchTeamLunches();
  }, [session, status]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch("/api/users", {
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || "Failed to fetch users");
        }
        
        const data = await response.json();
        setUsers(data);
      } catch (err) {
        console.error("Error fetching users:", err);
      }
    };

    fetchUsers();
  }, []);

  const handleAddTeamLunch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;

    setIsCreating(true);
    setError(null);

    try {
      const formattedMonth = formData.month ? `${formData.month}-01` : null;
      
      const response = await fetch("/api/team-lunches", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          month: formattedMonth,
          suggestedDate: formData.suggestedDate || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create team lunch");
      }

      const newTeamLunch = await response.json();
      setTeamLunches(prev => [newTeamLunch, ...prev]);
      setIsAddModalOpen(false);
      setFormData({
        month: "",
        suggestedDate: "",
        organizer1Id: "",
        organizer2Id: "",
        status: "NEW"
      });
      toast.success("Team lunch created successfully");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create team lunch");
      toast.error(err instanceof Error ? err.message : "Failed to create team lunch");
    } finally {
      setIsCreating(false);
    }
  };

  const handleEditTeamLunch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeamLunch || !isAdmin) return;

    setIsUpdating(true);
    setError(null);

    try {
      const formattedMonth = editFormData.month ? `${editFormData.month}-01` : null;
      
      const response = await fetch(`/api/team-lunches/${selectedTeamLunch.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...editFormData,
          month: formattedMonth,
          suggestedDate: editFormData.suggestedDate || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update team lunch");
      }

      const updatedTeamLunch = await response.json();
      setTeamLunches(prev => 
        prev.map(lunch => 
          lunch.id === selectedTeamLunch.id ? updatedTeamLunch : lunch
        )
      );
      setIsEditModalOpen(false);
      setSelectedTeamLunch(null);
      toast.success("Team lunch updated successfully");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update team lunch");
      toast.error(err instanceof Error ? err.message : "Failed to update team lunch");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteTeamLunch = async () => {
    if (!selectedTeamLunch || !isAdmin) return;

    setIsDeleting(true);
    setError(null);

    try {
      const response = await fetch(`/api/team-lunches/${selectedTeamLunch.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete team lunch");
      }

      setTeamLunches(prev => 
        prev.filter(lunch => lunch.id !== selectedTeamLunch.id)
      );
      setIsDeleteModalOpen(false);
      setSelectedTeamLunch(null);
      toast.success("Team lunch deleted successfully");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete team lunch");
      toast.error(err instanceof Error ? err.message : "Failed to delete team lunch");
    } finally {
      setIsDeleting(false);
    }
  };

  const openEditModal = (teamLunch: TeamLunch) => {
    if (!isAdmin) {
      toast.error("You don't have permission to edit team lunches");
      return;
    }
    setSelectedTeamLunch(teamLunch);
    setEditFormData({
      month: teamLunch.month,
      suggestedDate: teamLunch.suggestedDate,
      organizer1Id: teamLunch.organizer1.id,
      organizer2Id: teamLunch.organizer2.id,
      status: teamLunch.status,
      id: teamLunch.id
    });
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (teamLunch: TeamLunch) => {
    if (!isAdmin) return;
    setSelectedTeamLunch(teamLunch);
    setIsDeleteModalOpen(true);
  };

  const filteredTeamLunches = useMemo(() => {
    return teamLunches.filter((lunch) =>
      format(new Date(lunch.month), "MMMM yyyy").toLowerCase().includes(searchTerm.toLowerCase()) ||
      format(new Date(lunch.suggestedDate), "MMMM d, yyyy").toLowerCase().includes(searchTerm.toLowerCase()) ||
      lunch.organizer1.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lunch.organizer2.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [teamLunches, searchTerm]);

  const sortedTeamLunches = useMemo(() => {
    return filteredTeamLunches.sort((a, b) => {
      const aValue = a[sortColumn] || "";
      const bValue = b[sortColumn] || "";
      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredTeamLunches, sortColumn, sortDirection]);

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
      case "NEW":
        return "bg-blue-100 text-blue-800";
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "DONE":
        return "bg-green-100 text-green-800";
      case "RATING":
        return "bg-purple-100 text-purple-800";
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
        <h1 className="text-2xl font-bold">Team Lunches</h1>
        {isAdmin && (
          <Button 
            onClick={() => setIsAddModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Team Lunch
          </Button>
        )}
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
            <Input
              type="text"
              placeholder="Search team lunches..."
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
                  onClick={() => handleSort("month")}
                >
                  Month {sortColumn === "month" && (sortDirection === "asc" ? "↑" : "↓")}
                </TableHead>
                <TableHead
                  className="cursor-pointer"
                  onClick={() => handleSort("suggestedDate")}
                >
                  Suggested Date {sortColumn === "suggestedDate" && (sortDirection === "asc" ? "↑" : "↓")}
                </TableHead>
                <TableHead>Organizer 1</TableHead>
                <TableHead>Organizer 2</TableHead>
                <TableHead
                  className="cursor-pointer"
                  onClick={() => handleSort("status")}
                >
                  Status {sortColumn === "status" && (sortDirection === "asc" ? "↑" : "↓")}
                </TableHead>
                {isAdmin && <TableHead>Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedTeamLunches.map((teamLunch) => (
                <TableRow key={teamLunch.id}>
                  <TableCell>{format(new Date(teamLunch.month), "MMMM yyyy")}</TableCell>
                  <TableCell>{format(new Date(teamLunch.suggestedDate), "MMMM d, yyyy")}</TableCell>
                  <TableCell>{teamLunch.organizer1.name}</TableCell>
                  <TableCell>{teamLunch.organizer2.name}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(teamLunch.status)}>
                      {teamLunch.status}
                    </Badge>
                  </TableCell>
                  {isAdmin && (
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditModal(teamLunch)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openDeleteModal(teamLunch)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Add Team Lunch Modal */}
      {isAddModalOpen && isAdmin && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Add New Team Lunch</h2>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddTeamLunch} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Month</label>
                <Input
                  type="month"
                  value={formData.month}
                  onChange={(e) => setFormData({ ...formData, month: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Suggested Date</label>
                <Input
                  type="date"
                  value={formData.suggestedDate}
                  onChange={(e) => setFormData({ ...formData, suggestedDate: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Organizer 1</label>
                <select
                  value={formData.organizer1Id}
                  onChange={(e) => setFormData({ ...formData, organizer1Id: e.target.value })}
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                  required
                >
                  <option value="">Select Organizer 1</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Organizer 2</label>
                <select
                  value={formData.organizer2Id}
                  onChange={(e) => setFormData({ ...formData, organizer2Id: e.target.value })}
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                  required
                >
                  <option value="">Select Organizer 2</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                >
                  <option value="NEW">New</option>
                  <option value="PENDING">Pending</option>
                  <option value="DONE">Done</option>
                  <option value="RATING">Rating</option>
                </select>
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
                    'Create Team Lunch'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Team Lunch Modal */}
      {isEditModalOpen && selectedTeamLunch && isAdmin && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Edit Team Lunch</h2>
              <button
                onClick={() => {
                  setIsEditModalOpen(false);
                  setSelectedTeamLunch(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleEditTeamLunch} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Month</label>
                <Input
                  type="month"
                  value={editFormData.month}
                  onChange={(e) => setEditFormData({ ...editFormData, month: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Suggested Date</label>
                <Input
                  type="date"
                  value={editFormData.suggestedDate}
                  onChange={(e) => setEditFormData({ ...editFormData, suggestedDate: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Organizer 1</label>
                <select
                  value={editFormData.organizer1Id}
                  onChange={(e) => setEditFormData({ ...editFormData, organizer1Id: e.target.value })}
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                  required
                >
                  <option value="">Select Organizer 1</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Organizer 2</label>
                <select
                  value={editFormData.organizer2Id}
                  onChange={(e) => setEditFormData({ ...editFormData, organizer2Id: e.target.value })}
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                  required
                >
                  <option value="">Select Organizer 2</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <select
                  value={editFormData.status}
                  onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                >
                  <option value="NEW">New</option>
                  <option value="PENDING">Pending</option>
                  <option value="DONE">Done</option>
                  <option value="RATING">Rating</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setSelectedTeamLunch(null);
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
                    'Update Team Lunch'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Team Lunch Modal */}
      {isDeleteModalOpen && selectedTeamLunch && isAdmin && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Delete Team Lunch</h2>
              <button
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setSelectedTeamLunch(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this team lunch?
            </p>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setSelectedTeamLunch(null);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleDeleteTeamLunch}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Deleting...
                  </>
                ) : (
                  'Delete Team Lunch'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 