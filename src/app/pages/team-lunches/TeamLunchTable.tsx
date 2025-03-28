import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Edit2, Trash2 } from 'lucide-react';

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

interface TeamLunchTableProps {
  teamLunches: TeamLunch[];
  onEdit: (teamLunch: TeamLunch) => void;
  onDelete: (teamLunch: TeamLunch) => void;
}

const getStatusBadgeVariant = (status: string) => {
  switch (status.toUpperCase()) {
    case 'NEW':
      return 'default';
    case 'PENDING':
      return 'secondary';
    case 'DONE':
      return 'secondary';
    case 'RATING':
      return 'destructive';
    default:
      return 'outline';
  }
};

const formatDate = (date: Date) => {
  const d = new Date(date);
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric',
  }).format(d);
};

const formatFullDate = (date: Date) => {
  const d = new Date(date);
  return new Intl.DateTimeFormat('en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(d);
};

export function TeamLunchTable({
  teamLunches,
  onEdit,
  onDelete,
}: TeamLunchTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState<{
    key: keyof TeamLunch | 'organizer1.name' | 'organizer2.name';
    direction: 'asc' | 'desc';
  }>({
    key: 'month',
    direction: 'desc',
  });

  const handleSort = (key: typeof sortConfig.key) => {
    setSortConfig((prevConfig) => ({
      key,
      direction:
        prevConfig.key === key && prevConfig.direction === 'asc'
          ? 'desc'
          : 'asc',
    }));
  };

  const filteredAndSortedTeamLunches = teamLunches
    .filter((teamLunch) => {
      const searchString = searchQuery.toLowerCase();
      return (
        teamLunch.organizer1.name.toLowerCase().includes(searchString) ||
        teamLunch.organizer2.name.toLowerCase().includes(searchString) ||
        teamLunch.status.toLowerCase().includes(searchString) ||
        formatDate(teamLunch.month).toLowerCase().includes(searchString)
      );
    })
    .sort((a, b) => {
      const direction = sortConfig.direction === 'asc' ? 1 : -1;
      if (sortConfig.key === 'organizer1.name') {
        return direction * a.organizer1.name.localeCompare(b.organizer1.name);
      }
      if (sortConfig.key === 'organizer2.name') {
        return direction * a.organizer2.name.localeCompare(b.organizer2.name);
      }
      if (sortConfig.key === 'month' || sortConfig.key === 'suggestedDate') {
        return direction * (new Date(a[sortConfig.key]).getTime() - new Date(b[sortConfig.key]).getTime());
      }
      return direction * String(a[sortConfig.key]).localeCompare(String(b[sortConfig.key]));
    });

  return (
    <div className="space-y-4">
      <Input
        placeholder="Search team lunches..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="max-w-sm"
      />
      <Table>
        <TableCaption>A list of team lunches</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead
              className="cursor-pointer"
              onClick={() => handleSort('month')}
            >
              Month
            </TableHead>
            <TableHead
              className="cursor-pointer"
              onClick={() => handleSort('suggestedDate')}
            >
              Suggested Date
            </TableHead>
            <TableHead
              className="cursor-pointer"
              onClick={() => handleSort('organizer1.name')}
            >
              Organizer 1
            </TableHead>
            <TableHead
              className="cursor-pointer"
              onClick={() => handleSort('organizer2.name')}
            >
              Organizer 2
            </TableHead>
            <TableHead
              className="cursor-pointer"
              onClick={() => handleSort('status')}
            >
              Status
            </TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredAndSortedTeamLunches.map((teamLunch) => (
            <TableRow key={teamLunch.id}>
              <TableCell>
                {formatDate(teamLunch.month)}
              </TableCell>
              <TableCell>
                {formatFullDate(teamLunch.suggestedDate)}
              </TableCell>
              <TableCell>{teamLunch.organizer1.name}</TableCell>
              <TableCell>{teamLunch.organizer2.name}</TableCell>
              <TableCell>
                <Badge variant={getStatusBadgeVariant(teamLunch.status)}>
                  {teamLunch.status}
                </Badge>
              </TableCell>
              <TableCell className="space-x-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onEdit(teamLunch)}
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDelete(teamLunch)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
} 