import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { backend } from "@/lib/backendClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Send } from "lucide-react";
import { bookInquirySchema, getValidationErrors, type ValidationErrors } from "@/lib/validation";

const BookInquiry = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [form, setForm] = useState({ name: "", phone: "", email: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});

  useEffect(() => {
    if (!user) return;
    const fetchProfile = async () => {
      const { data } = await backend
        .from("profiles")
        .select("full_name, phone")
        .eq("user_id", user.id)
        .maybeSingle();
      setForm((prev) => ({
        ...prev,
        name: data?.full_name || user.user_metadata?.full_name || "",
        phone: data?.phone || "",
        email: user.email || "",
      }));
    };
    fetchProfile();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setErrors({});
    const result = bookInquirySchema.safeParse(form);
    if (!result.success) {
      setErrors(getValidationErrors(result.error));
      return;
    }

    setLoading(true);
    const { error } = await backend.from("purchase_inquiries").insert({
      user_id: user.id,
      name: form.name.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      message: form.message.trim(),
    }).select().single();
    setLoading(false);

    if (error) {
      toast({ title: "Failed to submit inquiry", description: error.message, variant: "destructive" });
    } else {
      backend.functions.invoke("send-notification", {
        body: { type: "inquiry_submitted", record: { user_id: user.id, name: form.name.trim(), phone: form.phone.trim(), email: form.email.trim(), message: form.message.trim(), status: "pending" } },
      });
      toast({
        title: "Inquiry Submitted!",
        description: "Your inquiry is pending review. Confirmation has been emailed to you.",
      });
      setForm((prev) => ({ ...prev, message: "" }));
    }
  };

  const ErrorText = ({ msg }: { msg?: string }) =>
    msg ? <p className="text-destructive text-xs font-sans mt-0.5">{msg}</p> : null;

  return (
    <div className="bg-background border border-border rounded-lg p-6">
      <h2 className="font-display text-xl font-bold text-foreground mb-1">Book Buffalo Purchase Inquiry</h2>
      <p className="font-sans text-sm text-muted-foreground mb-6">
        Fill in your requirements and we'll get back to you shortly.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
        <div>
          <Input
            placeholder="Full Name *"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="font-sans h-12"
            maxLength={100}
          />
          <ErrorText msg={errors.name} />
        </div>
        <div>
          <Input
            placeholder="Phone Number (10 digits) *"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, "").slice(0, 10) })}
            className="font-sans h-12"
            maxLength={10}
          />
          <ErrorText msg={errors.phone} />
        </div>
        <Input
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="font-sans h-12"
          maxLength={255}
          readOnly
        />
        <div>
          <Textarea
            placeholder="Your message or requirement... *"
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
            className="font-sans min-h-[120px]"
            maxLength={1000}
          />
          <ErrorText msg={errors.message} />
        </div>
        <Button
          type="submit"
          disabled={loading}
          className="bg-gold text-green-dark hover:bg-gold-light font-sans font-semibold h-12 gap-2"
        >
          <Send className="w-4 h-4" />
          {loading ? "Submitting..." : "Submit Inquiry"}
        </Button>
      </form>
    </div>
  );
};

export default BookInquiry;
