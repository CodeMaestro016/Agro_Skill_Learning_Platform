package com.agro.demo.util;

import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.io.InputStream;
import java.util.concurrent.TimeUnit;
import org.apache.tika.exception.TikaException;
import org.apache.tika.metadata.Metadata;
import org.apache.tika.parser.ParseContext;
import org.apache.tika.parser.Parser;
import org.apache.tika.parser.mp4.MP4Parser;
import org.apache.tika.sax.BodyContentHandler;
import org.xml.sax.SAXException;

@Component
public class VideoValidator {
    private static final int MAX_DURATION_SECONDS = 30;

    public boolean isValidVideoDuration(MultipartFile videoFile) {
        try {
            Metadata metadata = new Metadata();
            BodyContentHandler handler = new BodyContentHandler();
            Parser parser = new MP4Parser();
            ParseContext context = new ParseContext();

            try (InputStream inputStream = videoFile.getInputStream()) {
                parser.parse(inputStream, handler, metadata, context);
            }

            // Try different metadata keys for duration
            String duration = metadata.get("tika:duration");
            if (duration == null) {
                duration = metadata.get("duration");
            }
            if (duration == null) {
                duration = metadata.get("xmpDM:duration");
            }

            if (duration != null) {
                // Convert duration to seconds
                long durationInSeconds;
                try {
                    // Try parsing as milliseconds first
                    durationInSeconds = TimeUnit.MILLISECONDS.toSeconds(Long.parseLong(duration));
                } catch (NumberFormatException e) {
                    // If that fails, try parsing as seconds directly
                    durationInSeconds = (long) Double.parseDouble(duration);
                }
                return durationInSeconds <= MAX_DURATION_SECONDS;
            }
            return false;
        } catch (IOException | SAXException | TikaException e) {
            throw new RuntimeException("Error validating video duration", e);
        }
    }
} 