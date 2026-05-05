import { Layout } from "@bee/core/components/primitives/layout";
import type { UserAvatarMenuItem } from "@bee/core/components/primitives/user-avatar";
import { auth } from "@bee/core/modules/auth/auth.config";
import type { Navigation } from "@bee/core/types/client";
import { getTranslations } from "next-intl/server";
import { getMyMembership } from "../portal/(dashboard)/_server/membership.service";
import { PermissionProvider } from "@bee/core/providers/permission";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) return null;

  const membership = await getMyMembership();
  const t = await getTranslations("account.layout");

  const navigation: Navigation = {
    rootPath: "/portal/core/account",
    items: [
      {
        id: "preferences",
        title: t("navigation.preferences"),
        path: "/me",
        icon: "user-round-cog",
      },
      {
        id: "Authentication",
        title: t("navigation.authentication"),
        path: "/authentication",
        icon: "shield-user",
      },
      {
        id: "team",
        title: t("navigation.team"),
        path: "/team",
        icon: "users-round",
      },
      {
        id: "role",
        title: t("navigation.role"),
        path: "/role",
        icon: "square-user-round",
      },
    ],
  };

  const userAvatarMenu = [
    {
      id: "user",
      type: "Group",
      group: [
        {
          id: "dashboard",
          text: t("userMenu.dashboard"),
          href: "/portal",
          type: "Link",
        },
        // {
        //   id: 'accountSettings',
        //   text: 'Account Settings',
        //   href: '/portal/core/account/me',
        //   type: 'Link',
        // },
      ],
    },
    {
      id: "separator1",
      type: "Separator",
    },
    // {
    //   id: 'theme',
    //   text: 'Theme',
    //   type: 'Theme',
    // },
    // {
    //   id: 'separator2',
    //   type: 'Separator',
    // },
    // {
    //   id: 'homePage',
    //   text: 'Home Page',
    //   href: '/',
    //   type: 'Link',
    // },
    {
      id: "logOut",
      text: t("userMenu.logOut"),
      type: "LogOut",
    },
  ] satisfies UserAvatarMenuItem[];

  if (membership.staff) {
    userAvatarMenu[0].group?.push({
      id: "dev-center",
      text: t("userMenu.developer"),
      href: "/portal/core/staff-center",
      type: "Link",
    });
  }

  return (
    <PermissionProvider>
      <Layout
        breadcrumb={{
          items: [
            {
              title: t("breadcrumb.account"),
              link: "/portal/core/account",
            },
          ],
        }}
        navigation={navigation}
        menu={userAvatarMenu}
      >
        {children}
      </Layout>
    </PermissionProvider>
  );
}
