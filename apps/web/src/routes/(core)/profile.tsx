import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { trpc } from "@/utils/trpc";
import { globalSuccessToast, globalErrorToast } from "@/lib/toast";
import { useState, useRef } from "react";
import { Upload, ArrowLeft, Camera } from "lucide-react";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import ChangePasswordForm from "@/components/change-password-form";
import UpdateUserProfileForm from "@/components/update-user-profile-form";

export const Route = createFileRoute("/(core)/profile")({
  component: RouteComponent,
});

function RouteComponent() {
  const { data: user, refetch } = useSuspenseQuery(
    trpc.auth.profile.queryOptions(),
  );
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const uploadAvatarMutation = useMutation(
    trpc.user.updateAvatar.mutationOptions({
      onSuccess: async () => {
        globalSuccessToast("Avatar uploaded successfully");
        setSelectedFile(null);
        setPreviewUrl(null);
        await refetch();
      },
      onError: () => {
        globalErrorToast("Failed to upload avatar");
      },
    }),
  );

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        // 5MB limit
        globalErrorToast("File size must be less than 5MB");
        return;
      }

      if (!file.type.startsWith("image/")) {
        globalErrorToast("Please select an image file");
        return;
      }

      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append("avatar", selectedFile);
    uploadAvatarMutation.mutate(formData);
  };

  const handleCancel = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="flex h-screen flex-col overflow-y-auto bg-linear-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Main Content */}
      <main className="container mx-auto flex-1 px-4 py-8">
        <div className="mx-auto max-w-2xl space-y-6">
          {/* Avatar Upload Card */}
          <Card>
            <CardHeader>
              <CardTitle>Profile Picture</CardTitle>
              <CardDescription>Update your profile picture</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col items-center space-y-4">
                <div className="relative">
                  <Avatar className="h-32 w-32">
                    <AvatarImage
                      src={previewUrl || user.profilePictureUrl || undefined}
                      alt={user.name || "User"}
                    />
                    <AvatarFallback className="text-4xl">
                      {user.name.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <Button
                    size="icon"
                    variant="secondary"
                    className="absolute right-0 bottom-0 h-10 w-10 rounded-full"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Camera className="h-4 w-4" />
                  </Button>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                {selectedFile && (
                  <div className="flex gap-2">
                    <Button
                      onClick={handleUpload}
                      disabled={uploadAvatarMutation.isPending}
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      {uploadAvatarMutation.isPending
                        ? "Uploading..."
                        : "Upload"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleCancel}
                      disabled={uploadAvatarMutation.isPending}
                    >
                      Cancel
                    </Button>
                  </div>
                )}

                <p className="text-center text-xs text-muted-foreground">
                  Recommended: Square image, at least 400x400px
                  <br />
                  Maximum file size: 5MB
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Profile Information Form */}
          <UpdateUserProfileForm user={user} />

          {/* Change Password Form */}
          <ChangePasswordForm />
        </div>
      </main>
    </div>
  );
}
