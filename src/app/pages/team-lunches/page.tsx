"use client";

import './styles.css';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { TeamLunchTable } from './TeamLunchTable';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/components/ui/use-toast';
import { motion } from 'framer-motion';

interface TeamLunch {
  id: string;
  month: Date;
  suggestedDate: Date;
  status: string;
  organizer1: {
    id: string;
    name: string;
    email: string;
  };
  organizer2: {
    id: string;
    name: string;
    email: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export default function TeamLunchesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [teamLunches, setTeamLunches] = useState<TeamLunch[]>([]);
  const [selectedTeamLunch, setSelectedTeamLunch] = useState<TeamLunch | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const fetchTeamLunches = async () => {
    try {
      const response = await fetch('/api/team-lunches');
      if (!response.ok) {
        throw new Error('Failed to fetch team lunches');
      }
      const data = await response.json();
      // Convert string dates to Date objects
      const formattedData = data.map((lunch: any) => ({
        ...lunch,
        month: new Date(lunch.month),
        suggestedDate: new Date(lunch.suggestedDate),
        createdAt: new Date(lunch.createdAt),
        updatedAt: new Date(lunch.updatedAt),
      }));
      setTeamLunches(formattedData);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch team lunches',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    fetchTeamLunches();
  }, []);

  const handleEdit = (teamLunch: TeamLunch) => {
    router.push(`/pages/team-lunches/${teamLunch.id}`);
  };

  const handleDelete = async () => {
    if (!selectedTeamLunch) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/team-lunches/${selectedTeamLunch.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete team lunch');
      }

      setTeamLunches((prev) =>
        prev.filter((lunch) => lunch.id !== selectedTeamLunch.id)
      );
      toast({
        title: 'Success',
        description: 'Team lunch deleted successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete team lunch',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
      setShowDeleteDialog(false);
      setSelectedTeamLunch(null);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f8fafc]">
      {/* Animated background patterns */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -left-4 top-0 h-72 w-72 rounded-full bg-purple-200 mix-blend-multiply blur-xl opacity-70 animate-blob" />
        <div className="absolute -right-4 top-0 h-72 w-72 rounded-full bg-blue-200 mix-blend-multiply blur-xl opacity-70 animate-blob animation-delay-2000" />
        <div className="absolute -bottom-8 left-20 h-72 w-72 rounded-full bg-pink-200 mix-blend-multiply blur-xl opacity-70 animate-blob animation-delay-4000" />
      </div>

      {/* Main content */}
      <div className="relative">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          {/* Header Card */}
          <div className="mb-8 overflow-hidden rounded-2xl bg-white/30 backdrop-blur-lg border border-white/50 p-8 shadow-xl">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div className="space-y-2">
                <h2 className="text-4xl font-bold tracking-tight text-gray-900">
                  Team Lunches
                </h2>
                <p className="text-lg text-gray-600">
                  Manage team lunches and their organizers
                </p>
              </div>
              <Button 
                onClick={() => router.push('/pages/team-lunches/new')}
                size="lg"
                className="relative inline-flex transform items-center overflow-hidden rounded-xl bg-gray-900 px-8 py-3 text-white transition-all duration-300 hover:scale-105 hover:bg-gray-800 active:scale-95"
              >
                <Plus className="mr-2 h-5 w-5" />
                New Team Lunch
              </Button>
            </div>
          </div>

          {/* Table Card */}
          <div className="overflow-hidden rounded-2xl bg-white/80 backdrop-blur-lg shadow-xl">
            <div className="p-6">
              <TeamLunchTable
                teamLunches={teamLunches}
                onEdit={handleEdit}
                onDelete={(teamLunch) => {
                  setSelectedTeamLunch(teamLunch);
                  setShowDeleteDialog(true);
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="relative overflow-hidden rounded-2xl border-0 bg-white/80 p-6 backdrop-blur-xl shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-br from-red-50 to-pink-50 opacity-50" />
          <div className="relative">
            <AlertDialogHeader className="space-y-3">
              <AlertDialogTitle className="text-2xl font-bold text-gray-900">
                Delete Team Lunch
              </AlertDialogTitle>
              <AlertDialogDescription className="text-base text-gray-600">
                Are you sure you want to delete this team lunch? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="mt-6">
              <AlertDialogCancel className="rounded-xl border-2 hover:bg-gray-50 transition-colors duration-200">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDelete} 
                disabled={isLoading}
                className="rounded-xl bg-red-500 text-white hover:bg-red-600 transition-colors duration-200"
              >
                {isLoading ? (
                  <>
                    <svg
                      className="mr-2 h-4 w-4 animate-spin"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Deleting...
                  </>
                ) : (
                  'Delete'
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 