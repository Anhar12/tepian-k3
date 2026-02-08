import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { trpc } from "@/utils/trpc";
import { globalSuccessToast, globalErrorToast } from "@/lib/toast";
import { useState, useRef } from "react";
import { Upload, Camera, X, ImageIcon } from "lucide-react";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import ChangePasswordForm from "@/components/change-password-form";
import UpdateUserProfileForm from "@/components/update-user-profile-form";

export function ProfileManager() {
  const { data: user, refetch } = useSuspenseQuery(
    trpc.auth.profile.queryOptions(),
  );
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const uploadAvatarMutation = useMutation(
    trpc.user.updateAvatar.mutationOptions({
      onSuccess: async () => {
        globalSuccessToast("Avatar berhasil diunggah");
        setSelectedFile(null);
        setPreviewUrl(null);
        await refetch();
      },
      onError: (error) => {
        globalErrorToast(`Gagal mengunggah avatar: ${error.message}`);
      },
    }),
  );

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        globalErrorToast("Ukuran file harus kurang dari 5MB");
        return;
      }

      if (!file.type.startsWith("image/")) {
        globalErrorToast("Harap pilih file gambar");
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
    <div className="container space-y-6">
      {/* Avatar Upload Card */}
      <Card>
        <CardHeader className="text-center">
          <CardTitle>Profile Picture</CardTitle>
          <CardDescription>
            Upload a new avatar to personalize your profile
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col items-center space-y-6">
            {/* Avatar with overlay */}
            <div className="group relative">
              <Avatar className="h-36 w-36 border-4 border-muted shadow-lg">
                <AvatarImage
                  src={previewUrl || user.profilePictureUrl || undefined}
                  alt={user.name || "User"}
                  className="object-cover"
                />
                <AvatarFallback className="bg-primary/10 text-5xl font-semibold text-primary">
                  {user.name?.charAt(0)?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>

              {/* Hover overlay */}
              <div
                className="absolute inset-0 flex cursor-pointer items-center justify-center rounded-full bg-black/50 opacity-0 transition-opacity group-hover:opacity-100"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="flex flex-col items-center text-white">
                  <Camera className="h-6 w-6" />
                  <span className="mt-1 text-xs font-medium">Change</span>
                </div>
              </div>

              {/* Status badge */}
              {selectedFile && (
                <Badge
                  variant="secondary"
                  className="absolute -top-2 -right-2 gap-1"
                >
                  <ImageIcon className="h-3 w-3" />
                  New
                </Badge>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />

            {/* File info and actions */}
            {selectedFile ? (
              <Card className="w-full max-w-xs border-dashed">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {selectedFile.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {(selectedFile.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 shrink-0"
                      onClick={handleCancel}
                      disabled={uploadAvatarMutation.isPending}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <Separator className="my-3" />
                  <div className="flex gap-2">
                    <Button
                      className="flex-1"
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
                </CardContent>
              </Card>
            ) : (
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="gap-2"
              >
                <Upload className="h-4 w-4" />
                Choose Image
              </Button>
            )}

            <p className="max-w-xs text-center text-xs text-muted-foreground">
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
  );
}
