import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { backend } from "@/lib/backendClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Save, User, Camera, Trash2, X } from "lucide-react";
import { profileSchema, getValidationErrors, type ValidationErrors } from "@/lib/validation";

const UserProfile = () => {
  const { user, isAdmin, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ fullName: "", phone: "" });
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    backend
      .from("profiles")
      .select("full_name, phone, avatar_url")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        setForm({
          fullName: data?.full_name || user.user_metadata?.full_name || "",
          phone: data?.phone || "",
        });
        setAvatarUrl(data?.avatar_url || null);
      });
  }, [user]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith("image/")) {
      toast({ title: "Please select an image file", variant: "destructive" });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "Image must be under 2MB", variant: "destructive" });
      return;
    }

    setUploading(true);
    const ext = file.name.split(".").pop();
    const filePath = `${user.id}/avatar.${ext}`;

    const { error: uploadError } = await backend.storage
      .from("avatars")
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      setUploading(false);
      toast({ title: "Upload failed", description: uploadError.message, variant: "destructive" });
      return;
    }

    const { data: urlData } = backend.storage.from("avatars").getPublicUrl(filePath);
    const publicUrl = urlData.publicUrl + "?t=" + Date.now();

    await backend.from("profiles").update({ avatar_url: publicUrl }).eq("user_id", user.id);
    setAvatarUrl(publicUrl);
    setUploading(false);
    toast({ title: "Profile photo updated!" });
  };

  const handleRemoveAvatar = async () => {
    if (!user) return;
    setUploading(true);

    // Remove files from storage
    try {
      const { data: files, error } = await backend.storage.from("avatars").list(user.id);
      if (error) throw new Error(error.message);
      if (files && files.length > 0) {
        const { error: removeError } = await backend.storage.from("avatars").remove(files.map(f => `${user.id}/${f.name}`));
        if (removeError) throw new Error(removeError.message);
      }
    } catch (error) {
      setUploading(false);
      toast({ title: "Could not remove avatar files", description: error instanceof Error ? error.message : "Unknown error", variant: "destructive" });
      return;
    }

    await backend.from("profiles").update({ avatar_url: null }).eq("user_id", user.id);
    setAvatarUrl(null);
    setUploading(false);
    toast({ title: "Profile photo removed" });
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    setDeleting(true);

    const { data, error } = await backend.functions.invoke("self-delete-account");

    if (error || !data?.success) {
      setDeleting(false);
      toast({ title: "Account deletion failed", description: error?.message || data?.error || "Please try again", variant: "destructive" });
      return;
    }

    toast({ title: "Account deleted", description: "Your account has been permanently deleted." });
    await signOut();
    navigate("/");
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setErrors({});
    const result = profileSchema.safeParse(form);
    if (!result.success) {
      setErrors(getValidationErrors(result.error));
      return;
    }
    setLoading(true);
    const { error } = await backend
      .from("profiles")
      .update({ full_name: form.fullName.trim(), phone: form.phone.trim() })
      .eq("user_id", user.id);
    setLoading(false);
    if (error) {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Profile updated successfully!" });
    }
  };

  const ErrorText = ({ msg }: { msg?: string }) =>
    msg ? <p className="text-destructive text-xs font-sans mt-0.5">{msg}</p> : null;

  return (
    <div className="bg-background border border-border rounded-lg p-6">
      <div className="flex items-center gap-4 mb-6">
        {/* Avatar */}
        <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
          <div className="w-16 h-16 rounded-full bg-gold/10 flex items-center justify-center overflow-hidden border-2 border-border">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <User className="w-8 h-8 text-gold" />
            )}
          </div>
          <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Camera className="w-5 h-5 text-white" />
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarUpload}
            className="hidden"
          />
        </div>
        <div className="flex-1">
          <h2 className="font-display text-xl font-bold text-foreground">My Profile</h2>
          <p className="font-sans text-sm text-muted-foreground">
            {uploading ? "Uploading photo..." : "Click photo to change"}
          </p>
        </div>
        {avatarUrl && (
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => { e.stopPropagation(); handleRemoveAvatar(); }}
            disabled={uploading}
            className="text-destructive hover:text-destructive hover:bg-destructive/10 gap-1 font-sans text-xs"
          >
            <X className="w-3.5 h-3.5" />
            Remove Photo
          </Button>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-4 max-w-lg">
        <div>
          <label className="font-sans text-sm font-medium text-foreground mb-1 block">Email</label>
          <Input value={user?.email || ""} readOnly className="font-sans h-12 bg-muted/20" />
        </div>
        <div>
          <label className="font-sans text-sm font-medium text-foreground mb-1 block">Full Name</label>
          <Input
            placeholder="Your full name"
            value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            className="font-sans h-12"
            maxLength={100}
          />
          <ErrorText msg={errors.fullName} />
        </div>
        <div>
          <label className="font-sans text-sm font-medium text-foreground mb-1 block">Phone Number</label>
          <Input
            placeholder="Phone number (10 digits)"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, "").slice(0, 10) })}
            className="font-sans h-12"
            maxLength={10}
          />
          <ErrorText msg={errors.phone} />
        </div>
        <Button
          type="submit"
          disabled={loading}
          className="bg-gold text-green-dark hover:bg-gold-light font-sans font-semibold h-12 gap-2"
        >
          <Save className="w-4 h-4" />
          {loading ? "Saving..." : "Save Changes"}
        </Button>
      </form>

      {/* Delete Account Section - Only for non-admin users */}
      {!isAdmin && (
        <div className="mt-10 pt-6 border-t border-border">
          <h3 className="font-display text-lg font-bold text-destructive mb-2">Danger Zone</h3>
          <p className="font-sans text-sm text-muted-foreground mb-4">
            Permanently delete your account and all associated data. This action cannot be undone.
          </p>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="font-sans font-semibold gap-2">
                <Trash2 className="w-4 h-4" />
                Delete My Account
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="font-display">Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription className="font-sans">
                  This will permanently delete your account, profile, inquiries, and all associated data.
                  This action <strong>cannot be undone</strong>.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="font-sans">Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteAccount}
                  disabled={deleting}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90 font-sans"
                >
                  {deleting ? "Deleting..." : "Yes, Delete My Account"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}
    </div>
  );
};

export default UserProfile;
