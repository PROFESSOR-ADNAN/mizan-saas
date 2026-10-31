import { teamRepo, TeamModel } from '../models/Team.js';
import { teamMemberRepo, TeamMemberModel } from '../models/TeamMember.js';
import { NotFoundError } from '../utils/errors.js';

export class TeamService {
  static async listTeams(orgId: string): Promise<any[]> {
    return teamRepo.find(orgId, {});
  }

  static async createTeam(orgId: string, data: { name: string; description?: string; dataSourceIds?: string[]; dashboardIds?: string[] }): Promise<any> {
    return teamRepo.create(orgId, {
      name: data.name,
      description: data.description,
      dataSourceIds: (data.dataSourceIds || []) as any,
      dashboardIds: (data.dashboardIds || []) as any,
    });
  }

  static async updateTeam(orgId: string, teamId: string, updates: any): Promise<any> {
    const updated = await teamRepo.updateOne(orgId, { _id: teamId as any }, { $set: updates });
    if (updated.matchedCount === 0) throw new NotFoundError('Team not found');
    return teamRepo.findById(orgId, teamId);
  }

  static async addMember(orgId: string, teamId: string, userId: string): Promise<any> {
    return teamMemberRepo.create(orgId, {
      teamId: teamId as any,
      userId: userId as any,
    });
  }

  static async removeMember(orgId: string, teamId: string, userId: string): Promise<void> {
    await teamMemberRepo.deleteOne(orgId, { teamId: teamId as any, userId: userId as any });
  }

  static async getUserTeamDataSources(orgId: string, userId: string): Promise<string[] | null> {
    const memberships = await teamMemberRepo.find(orgId, { userId: userId as any });
    if (memberships.length === 0) {
      return null; // Not restricted by teams
    }

    const teamIds = memberships.map((m) => m.teamId);
    const teams = await teamRepo.find(orgId, { _id: { $in: teamIds } });

    const sourceIds = new Set<string>();
    for (const t of teams) {
      for (const s of t.dataSourceIds) {
        sourceIds.add(s.toString());
      }
    }

    return Array.from(sourceIds);
  }
}
