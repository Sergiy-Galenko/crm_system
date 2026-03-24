import { SettingsForm } from "@/components/forms/settings-form";
import { UserDialog } from "@/components/forms/user-dialog";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/table";
import { teamUsersWhere } from "@/lib/crm-scope";
import { prisma } from "@/lib/db";
import { getServerTranslator } from "@/lib/locale-server";
import { requireUser } from "@/lib/session";

export default async function SettingsPage() {
  const { locale, t } = await getServerTranslator();
  const currentUser = await requireUser();
  const canAssignAdmin = currentUser.role === "ADMIN";
  const teamDescription = canAssignAdmin
    ? t("Admins can create and update workspace members. Managers can create and update only the teammates they added.")
    : t("Managers can create and update only the teammates they added.");

  const team = await prisma.user.findMany({
    where: teamUsersWhere(currentUser),
    orderBy: {
      createdAt: "asc",
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      roleLabel: true,
      title: true,
      createdAt: true,
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={t("Admin")}
        title={t("Settings")}
        description={t("Manage your own profile details and, when permitted, control workspace access for the broader team.")}
      />

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">{t("Profile")}</TabsTrigger>
          <TabsTrigger value="team">{t("Team")}</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <SettingsForm user={currentUser} />
        </TabsContent>

        <TabsContent value="team">
          <div className="space-y-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-950">{t("Team access")}</h3>
                <p className="mt-1 text-sm text-slate-500">
                  {teamDescription}
                </p>
              </div>
              <UserDialog canAssignAdmin={canAssignAdmin} />
            </div>

            <div className="card overflow-hidden rounded-[2rem] p-2">
              <div className="scrollbar-subtle overflow-x-auto">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableHeaderCell>{t("Name")}</TableHeaderCell>
                      <TableHeaderCell>{t("Role")}</TableHeaderCell>
                      <TableHeaderCell>{t("Title")}</TableHeaderCell>
                      <TableHeaderCell>{t("Joined")}</TableHeaderCell>
                      <TableHeaderCell className="text-right">{t("Actions")}</TableHeaderCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {team.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell>
                          <p className="font-medium text-slate-950">{member.name}</p>
                          <div className="mt-1 text-xs text-slate-500">{member.email}</div>
                        </TableCell>
                        <TableCell>
                          <StatusBadge value={member.role} label={member.roleLabel} />
                        </TableCell>
                        <TableCell>{member.title ?? t("No title")}</TableCell>
                        <TableCell>{member.createdAt.toLocaleDateString(locale === "uk" ? "uk-UA" : "en-US", { month: "short", day: "numeric", year: "numeric" })}</TableCell>
                        <TableCell className="text-right">
                          <UserDialog
                            canAssignAdmin={canAssignAdmin}
                            user={{
                              id: member.id,
                              name: member.name,
                              email: member.email,
                              role: member.role,
                              roleLabel: member.roleLabel,
                              title: member.title,
                            }}
                            triggerLabel="Edit"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
