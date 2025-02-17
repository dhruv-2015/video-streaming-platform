import { Separator } from "@/components/ui/separator";
import { ProfileForm } from "./profile-form";

export default function ProfilePage() {
  return (
    <div className="space-y-6 container mx-auto mt-5">
      {/* <div>
        <h3 className="text-lg font-medium">Profile</h3>
        <p className="text-sm text-muted-foreground">
          This is how others will see you on the site.
        </p>
      </div> */}
      {/* <Separator /> */}
      <ProfileForm />
    </div>
  );
}
