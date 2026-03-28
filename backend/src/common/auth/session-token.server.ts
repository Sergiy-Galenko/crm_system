import { loadWorkspaceEnv } from "@backend/common/env/load-workspace-env";
import {
  signSessionToken as signSessionTokenBase,
  verifySessionToken as verifySessionTokenBase,
} from "./session-token";

loadWorkspaceEnv();

export const signSessionToken = signSessionTokenBase;
export const verifySessionToken = verifySessionTokenBase;
