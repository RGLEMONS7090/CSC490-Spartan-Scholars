package com.spartanscholars.backend.note;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.util.Locale;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.poi.hwpf.HWPFDocument;
import org.apache.poi.hwpf.extractor.WordExtractor;
import org.apache.poi.xwpf.extractor.XWPFWordExtractor;
import org.apache.poi.xwpf.usermodel.XWPFDocument;

public final class DocumentTextExtractor {

    private static final int MAX_EXTRACTED_CHARS = 20_000;

    private DocumentTextExtractor() {
    }

    public static String extract(String fileName, byte[] bytes) throws IOException {
        if (fileName == null || bytes == null || bytes.length == 0) {
            return "";
        }

        String lower = fileName.toLowerCase(Locale.ROOT);
        String text;
        if (lower.endsWith(".pdf")) {
            text = extractPdf(bytes);
        } else if (lower.endsWith(".docx")) {
            text = extractDocx(bytes);
        } else if (lower.endsWith(".doc")) {
            text = extractDoc(bytes);
        } else {
            return "";
        }

        String normalized = text == null ? "" : text.trim();
        if (normalized.length() <= MAX_EXTRACTED_CHARS) {
            return normalized;
        }
        return normalized.substring(0, MAX_EXTRACTED_CHARS) + "\n\n[Text truncated]";
    }

    private static String extractPdf(byte[] bytes) throws IOException {
        try (PDDocument document = Loader.loadPDF(bytes)) {
            return new PDFTextStripper().getText(document);
        }
    }

    private static String extractDocx(byte[] bytes) throws IOException {
        try (
                ByteArrayInputStream input = new ByteArrayInputStream(bytes);
                XWPFDocument document = new XWPFDocument(input);
                XWPFWordExtractor extractor = new XWPFWordExtractor(document)
        ) {
            return extractor.getText();
        }
    }

    private static String extractDoc(byte[] bytes) throws IOException {
        try (
                ByteArrayInputStream input = new ByteArrayInputStream(bytes);
                HWPFDocument document = new HWPFDocument(input);
                WordExtractor extractor = new WordExtractor(document)
        ) {
            return extractor.getText();
        }
    }
}
