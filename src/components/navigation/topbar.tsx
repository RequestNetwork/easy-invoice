import { ModeToggle } from "../mode-toggle";
// import { UserMenu } from "../user-menu";

export function Topbar() {
  return (
    <div className="flex flex-row h-16 w-full items-center justify-between px-4 border-b">
      {/* <UserMenu user={undefined} /> */}
      <ModeToggle />
    </div>
  );
}
