package com.spartanscholars.backend.ai;

import java.io.IOException;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;

public final class DegreeAuditPdfExtractor {

    private static final int MAX_EXTRACTED_CHARS = 80_000;

    private DegreeAuditPdfExtractor() {
    }

    public static String extract(byte[] bytes) throws IOException {
        if (bytes == null || bytes.length == 0) {
            return "";
        }

        try (PDDocument document = Loader.loadPDF(bytes)) {
            String text = new PDFTextStripper().getText(document);
            String normalized = text == null ? "" : text.trim();
            if (normalized.length() <= MAX_EXTRACTED_CHARS) {
                return normalized;
            }
            return normalized.substring(0, MAX_EXTRACTED_CHARS) + "\n\n[Audit text truncated]";
        }
    }
}
