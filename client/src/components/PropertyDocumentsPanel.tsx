import { useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, FileText, Plus, Trash2, Upload } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/language-context";
import { DOCUMENT_TYPES } from "@/utils/property-document-types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { PropertyDocument } from "@shared/schema";

type PropertyDocumentsPanelProps = {
  propertyUuid: string;
  className?: string;
};

export function PropertyDocumentsPanel({ propertyUuid, className }: PropertyDocumentsPanelProps) {
  const { toast } = useToast();
  const { t } = useLanguage();
  const qc = useQueryClient();

  const [documentDialogOpen, setDocumentDialogOpen] = useState(false);
  const [documentForm, setDocumentForm] = useState({
    documentType: "",
    fileName: "",
    file: null as File | null,
  });
  const [documentUploading, setDocumentUploading] = useState(false);
  const documentFileInputRef = useRef<HTMLInputElement>(null);
  const [deleteDocConfirmId, setDeleteDocConfirmId] = useState<number | null>(null);
  const [deleteDocConfirmName, setDeleteDocConfirmName] = useState("");

  const documentsQueryKey = ["/api/properties", propertyUuid, "documents"] as const;

  const { data: documents = [], isLoading: documentsLoading } = useQuery<PropertyDocument[]>({
    queryKey: documentsQueryKey,
    queryFn: async () => {
      try {
        const res = await fetch(`/api/properties/${propertyUuid}/documents`, {
          credentials: "include",
        });
        if (!res.ok) return [];
        return await res.json();
      } catch {
        return [];
      }
    },
    enabled: Boolean(propertyUuid),
  });

  const groupedDocuments = useMemo(
    () =>
      documents.reduce<Record<string, PropertyDocument[]>>((acc, doc) => {
        const type = doc.documentType;
        if (!acc[type]) acc[type] = [];
        acc[type].push(doc);
        return acc;
      }, {}),
    [documents],
  );

  const documentMutation = useMutation({
    mutationFn: async (data: typeof documentForm) => {
      if (!data.file) throw new Error("No file selected");

      setDocumentUploading(true);
      const formData = new FormData();
      formData.append("document", data.file);

      const uploadRes = await fetch("/api/property-documents/upload-direct", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (!uploadRes.ok) throw new Error("Upload failed");
      const { fileUrl, fileSize } = await uploadRes.json();

      return apiRequest("POST", `/api/properties/${propertyUuid}/documents`, {
        propertyUuid,
        documentType: data.documentType,
        fileName: data.fileName,
        fileUrl,
        fileSize: fileSize || "N/A",
        uploadDate: new Date().toISOString().split("T")[0],
      });
    },
    onSuccess: () => {
      setDocumentUploading(false);
      qc.invalidateQueries({ queryKey: documentsQueryKey });
      toast({
        title: t("propertyManagement.toast.document_created"),
        description: t("propertyManagement.toast.document_uploaded"),
      });
      setDocumentDialogOpen(false);
      setDocumentForm({ documentType: "", fileName: "", file: null });
    },
    onError: () => {
      setDocumentUploading(false);
      toast({
        title: t("common.error"),
        description: t("propertyManagement.toast.document_upload_error"),
        variant: "destructive",
      });
    },
  });

  const deleteDocumentMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/properties/${propertyUuid}/documents/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: documentsQueryKey });
      toast({ title: t("propertyManagement.toast.document_deleted") });
    },
  });

  return (
    <div className={cn("space-y-4", className)} data-testid={`property-documents-panel-${propertyUuid}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{t("propertyManagement.documents.title")}</h3>
        <Button
          size="sm"
          variant="outline"
          className="bg-[#0284c5e6] text-[#f7fafd]"
          data-testid="button-upload-document"
          onClick={() => setDocumentDialogOpen(true)}
        >
          <Plus className="h-4 w-4 mr-1" />
          {t("propertyManagement.documents.upload")}
        </Button>
      </div>

      {documentsLoading ? (
        <p className="text-sm text-gray-500">{t("propertyManagement.loading.documents")}</p>
      ) : documents.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-gray-300 mb-4" />
            <p className="text-gray-500">{t("propertyManagement.empty.no_documents")}</p>
          </CardContent>
        </Card>
      ) : (
        Object.entries(groupedDocuments).map(([type, docs]) => (
          <Card key={type} className="border" data-testid={`card-document-group-${type}`}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">{type}</CardTitle>
                <Badge variant="secondary" className="text-xs">
                  {docs.length}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {docs.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between py-2 border-b last:border-0"
                  data-testid={`row-document-${doc.id}`}
                >
                  <div
                    className="flex items-center gap-3 cursor-pointer hover:opacity-70 transition-opacity"
                    onClick={() => {
                      if (doc.fileUrl && doc.fileUrl !== "#") {
                        window.open(doc.fileUrl, "_blank");
                      }
                    }}
                    data-testid={`link-open-doc-${doc.id}`}
                  >
                    <FileText className="h-5 w-5 text-red-500" />
                    <div>
                      <p className="text-sm font-medium text-primary underline-offset-2 hover:underline">
                        {doc.fileName}
                      </p>
                      <p className="text-xs text-gray-400">
                        {doc.uploadDate} · {doc.fileSize}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      data-testid={`button-download-doc-${doc.id}`}
                      onClick={() => {
                        if (doc.fileUrl && doc.fileUrl !== "#") {
                          const link = document.createElement("a");
                          link.href = doc.fileUrl;
                          link.download = doc.fileName;
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                        }
                      }}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      data-testid={`button-delete-doc-${doc.id}`}
                      onClick={() => {
                        setDeleteDocConfirmId(doc.id);
                        setDeleteDocConfirmName(doc.fileName);
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ))
      )}

      <Dialog open={documentDialogOpen} onOpenChange={setDocumentDialogOpen}>
        <DialogContent className="w-[95vw] max-w-[625px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("propertyManagement.dialog.document.title")}</DialogTitle>
            <DialogDescription>
              {t("propertyManagement.dialog.document.description")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">
                {t("propertyManagement.label.document_type")}
              </label>
              <Select
                value={documentForm.documentType}
                onValueChange={(v) => setDocumentForm({ ...documentForm, documentType: v })}
              >
                <SelectTrigger data-testid="select-document-type">
                  <SelectValue placeholder={t("propertyManagement.placeholder.select_type")} />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {DOCUMENT_TYPES.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">{t("propertyManagement.label.file")}</label>
              <input
                ref={documentFileInputRef}
                type="file"
                accept=".pdf,.png,.jpg,.jpeg"
                data-testid="input-document-file"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const maxSize = 5 * 1024 * 1024;
                    const allowedTypes = ["application/pdf", "image/png", "image/jpeg"];
                    const allowedExtensions = [".pdf", ".png", ".jpg", ".jpeg"];
                    const fileExtension = file.name
                      .toLowerCase()
                      .slice(file.name.lastIndexOf("."));
                    if (
                      !allowedTypes.includes(file.type) &&
                      !allowedExtensions.includes(fileExtension)
                    ) {
                      toast({
                        title: "Formato no permitido",
                        description: "Solo se permiten archivos PDF, PNG y JPG.",
                        variant: "destructive",
                      });
                      e.target.value = "";
                      return;
                    }
                    if (file.size > maxSize) {
                      toast({
                        title: "Archivo demasiado grande",
                        description: "El tamaño máximo permitido es 5 MB.",
                        variant: "destructive",
                      });
                      e.target.value = "";
                      return;
                    }
                    setDocumentForm({ ...documentForm, fileName: file.name, file });
                  }
                }}
              />
              <div
                className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
                data-testid="dropzone-document"
                onClick={() => documentFileInputRef.current?.click()}
              >
                {documentForm.file ? (
                  <div className="flex items-center justify-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    <span className="text-sm font-medium">{documentForm.fileName}</span>
                    <span className="text-xs text-gray-400">
                      ({(documentForm.file.size / 1024 / 1024).toFixed(2)} MB)
                    </span>
                  </div>
                ) : (
                  <div>
                    <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                    <p className="text-sm text-gray-500">
                      {t("propertyManagement.documents.dropzone.click")}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {t("propertyManagement.documents.dropzone.formats")}
                    </p>
                    <p className="text-xs text-gray-400">
                      {t("propertyManagement.documents.dropzone.max_size")}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              data-testid="button-confirm-document"
              onClick={() => documentMutation.mutate(documentForm)}
              disabled={
                documentMutation.isPending ||
                documentUploading ||
                !documentForm.documentType ||
                !documentForm.file
              }
            >
              {documentMutation.isPending || documentUploading
                ? t("common.uploading")
                : t("propertyManagement.documents.upload")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={deleteDocConfirmId !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteDocConfirmId(null);
        }}
      >
        <DialogContent className="w-[95vw] max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t("propertyManagement.dialog.delete_document.title")}</DialogTitle>
            <DialogDescription>
              {t("propertyManagement.dialog.delete_document.description", {
                name: deleteDocConfirmName,
              })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:justify-end">
            <Button
              variant="outline"
              data-testid="button-cancel-delete-doc"
              onClick={() => setDeleteDocConfirmId(null)}
            >
              {t("common.cancel")}
            </Button>
            <Button
              variant="destructive"
              data-testid="button-confirm-delete-doc"
              disabled={deleteDocumentMutation.isPending}
              onClick={() => {
                if (deleteDocConfirmId !== null) {
                  deleteDocumentMutation.mutate(deleteDocConfirmId, {
                    onSuccess: () => setDeleteDocConfirmId(null),
                  });
                }
              }}
            >
              {deleteDocumentMutation.isPending ? t("common.deleting") : t("common.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
