import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { backend } from "@/lib/backendClient";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { LogIn, MessageSquare } from "lucide-react";
import { buffaloEnquirySchema, getValidationErrors, type ValidationErrors } from "@/lib/validation";
import { Link } from "react-router-dom";
import { useUserPreferences } from "@/lib/userPreferences";

interface BuffaloListing {
  id: string;
  name: string;
  breed: string;
  price: number;
  age: string;
  weight: string;
  milk_yield: string;
  description?: string | null;
}

interface BuffaloEnquiryDialogProps {
  buffalo: BuffaloListing;
  imageUrl?: string;
  onClose: () => void;
}

const BuffaloEnquiryDialog = ({ buffalo, imageUrl, onClose }: BuffaloEnquiryDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const userPrefs = useUserPreferences();

  const [form, setForm] = useState(() => {
    const defaultName = userPrefs.fullName || user?.user_metadata?.full_name || "";
    const defaultPhone = userPrefs.whatsappNumber || user?.user_metadata?.phone || "";
    const purposeText = userPrefs.purchasePurpose ? ` for ${userPrefs.purchasePurpose}` : "";
    const stateText = userPrefs.deliveryState ? ` Transport to ${userPrefs.deliveryState}.` : "";
    return {
      name: defaultName,
      phone: defaultPhone,
      email: user?.email || "",
      message: `I am interested in ${buffalo.name} (${buffalo.breed})${purposeText}, listed at ₹${buffalo.price.toLocaleString()}.${stateText} Please share more details and availability.`,
    };
  });
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrors({});
    const validated = buffaloEnquirySchema.safeParse(form);
    if (!validated.success) {
      setErrors(getValidationErrors(validated.error));
      return;
    }
    setSubmitting(true);

    const { error } = await backend.from("purchase_inquiries").insert({
      user_id: user?.id || null,
      name: form.name.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      message: form.message.trim(),
      buffalo_listing_id: buffalo.id,
      buffalo_name: buffalo.name,
      buffalo_breed: buffalo.breed,
      buffalo_price: buffalo.price,
      status: "pending",
    });

    if (error) {
      toast({ title: "Enquiry failed", description: error.message, variant: "destructive" });
    } else {
      toast({
        title: "Enquiry Sent!",
        description: `Your enquiry about ${buffalo.name} is pending review. Confirmation has been emailed to you.`,
      });
      onClose();
    }
    setSubmitting(false);
  };

  if (!user) {
    return (
      <Dialog open onOpenChange={() => onClose()}>
        <DialogContent className="w-[95vw] max-w-md rounded-xl p-4 sm:p-6">
          <DialogHeader><DialogTitle className="font-display text-lg">Sign in to send an enquiry</DialogTitle></DialogHeader>
          <p className="font-sans text-sm text-muted-foreground">Please register and sign in before enquiring about {buffalo.name}. We will use your registered email for confirmations and status updates.</p>
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Link to="/login"><Button className="bg-gold text-green-dark hover:bg-gold-light gap-2"><LogIn className="w-4 h-4" /> Sign In</Button></Link>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="w-[95vw] max-w-md max-h-[90vh] overflow-y-auto rounded-xl p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="font-display text-base sm:text-lg pr-6">Enquire about {buffalo.name}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3.5 sm:space-y-4">
          <div className="bg-muted/20 rounded-lg p-3 sm:p-3.5 border border-border flex items-start gap-3">
            {imageUrl && (
              <div className="w-20 h-20 rounded-md bg-neutral-900 overflow-hidden shrink-0 border border-border relative flex items-center justify-center">
                <img src={imageUrl} alt="" aria-hidden="true" className="absolute inset-0 w-full h-full object-cover blur-md scale-125 opacity-35 pointer-events-none" />
                <img src={imageUrl} alt={buffalo.name} className="relative z-10 max-h-full max-w-full w-auto h-auto object-contain p-1" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="font-sans text-sm font-semibold text-foreground">{buffalo.name}</p>
              <p className="font-sans text-xs text-muted-foreground">{buffalo.breed} • {buffalo.age} • {buffalo.weight} • {buffalo.milk_yield}</p>
              {buffalo.description && <p className="font-sans text-xs text-muted-foreground mt-1 line-clamp-2">{buffalo.description}</p>}
              <p className="font-display text-base font-bold text-gold mt-1">Listed price: ₹{buffalo.price.toLocaleString()}</p>
            </div>
          </div>

          <div>
            <Label htmlFor="enquiry-name">Name</Label>
            <Input id="enquiry-name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} maxLength={100} />
            <p className="text-xs text-destructive mt-1">{errors.name}</p>
          </div>
          <div>
            <Label htmlFor="enquiry-phone">Phone</Label>
            <Input id="enquiry-phone" type="tel" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value.replace(/\D/g, "").slice(0, 10) })} maxLength={10} />
            <p className="text-xs text-destructive mt-1">{errors.phone}</p>
          </div>
          <div>
            <Label htmlFor="enquiry-email">Email</Label>
            <Input id="enquiry-email" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} maxLength={255} />
            <p className="text-xs text-destructive mt-1">{errors.email}</p>
          </div>
          <div>
            <Label htmlFor="enquiry-message">Message</Label>
            <Textarea id="enquiry-message" value={form.message} onChange={(event) => setForm({ ...form, message: event.target.value })} maxLength={1000} rows={4} />
            <p className="text-xs text-destructive mt-1">{errors.message}</p>
          </div>
          <Button type="submit" disabled={submitting} className="w-full bg-gold text-green-dark hover:bg-gold-light font-sans font-semibold gap-2 h-11">
            <MessageSquare className="w-4 h-4" />
            {submitting ? "Sending Enquiry..." : "Send Enquiry"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default BuffaloEnquiryDialog;
