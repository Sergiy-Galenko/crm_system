import { SettingsForm } from "@/components/forms/settings-form";
import { UserDialog } from "@/components/forms/user-dialog";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/table";
import { prisma } from "@/lib/db";
import { getServerTranslator } from "@/lib/locale-server";
import { requireUser } from "@/lib/session";

export default async function SettingsPage() {
  const { locale, t } = await getServerTranslator();
  const currentUser = await requireUser();

  const team = await prisma.user.findMany({
    orderBy: {
      createdAt: "asc",
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
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
                  {t("Admins can create and update workspace members. Managers can view the team roster.")}
                </p>
              </div>
              {currentUser.role === "ADMIN" ? <UserDialog /> : null}
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
                      {currentUser.role === "ADMIN" ? <TableHeaderCell className="text-right">{t("Actions")}</TableHeaderCell> : null}
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
                          <StatusBadge value={member.role} />
                        </TableCell>
                        <TableCell>{member.title ?? t("No title")}</TableCell>
                        <TableCell>{member.createdAt.toLocaleDateString(locale === "uk" ? "uk-UA" : "en-US", { month: "short", day: "numeric", year: "numeric" })}</TableCell>
                        {currentUser.role === "ADMIN" ? (
                          <TableCell className="text-right">
                            <UserDialog
                              user={{
                                id: member.id,
                                name: member.name,
                                email: member.email,
                                role: member.role,
                                title: member.title,
                              }}
                              triggerLabel="Edit"
                            />
                          </TableCell>
                        ) : null}
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
