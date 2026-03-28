import { loadWorkspaceEnv } from "@backend/common/env/load-workspace-env";
import {
  signTeamInviteToken as signTeamInviteTokenBase,
  verifyTeamInviteToken as verifyTeamInviteTokenBase,
} from "./team-invite-token";

loadWorkspaceEnv();

export const signTeamInviteToken = signTeamInviteTokenBase;
export const verifyTeamInviteToken = verifyTeamInviteTokenBase;
