package com.saarthix.jobs.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

@Service
public class AIProblemStatementService {

    @Value("${openai.api.key:}")
    private String openaiApiKey;

    @Value("${openai.api.url:https://api.openai.com/v1/chat/completions}")
    private String openaiApiUrl;

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    public AIProblemStatementService() {
        this.restTemplate = new RestTemplate();
        this.objectMapper = new ObjectMapper();
    }

    public String improveProblemStatement(String originalStatement) {
        // If API key is not configured, return a helpful message
        if (openaiApiKey == null || openaiApiKey.isEmpty()) {
            return "AI improvement is not configured. Please add your OpenAI API key to application.properties as 'openai.api.key'";
        }

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.set("Content-Type", "application/json");
            headers.set("Authorization", "Bearer " + openaiApiKey);

            // Count words in original statement to ensure minimum is maintained
            int originalWordCount = originalStatement.trim().split("\\s+").length;
            int minWordCount = Math.max(50, originalWordCount); // Ensure at least 50 words, or maintain original if higher
            
            // Create the enhanced prompt for OpenAI
            String systemPrompt = "You are an expert system designer, AI architect, and technical product reviewer.\n\n" +
                    "Your task is to analyze the given problem statement and do the following:\n\n" +
                    "1. Identify all logical contradictions, unrealistic assumptions, vague requirements, and technically impossible claims.\n\n" +
                    "2. Clearly list these issues under sections such as:\n" +
                    "   - Logical Issues\n" +
                    "   - Technical Impossibilities\n" +
                    "   - Scalability & Performance Problems\n" +
                    "   - Security & Privacy Concerns\n" +
                    "   - Ambiguities & Missing Requirements\n\n" +
                    "3. Explain briefly WHY each issue is a problem from a real-world system design perspective.\n\n" +
                    "4. Rewrite the problem statement into a realistic, technically feasible, and well-scoped version while:\n" +
                    "   - Preserving the original intent as much as possible\n" +
                    "   - Removing impossible guarantees (e.g., 100% accuracy, no-data learning)\n" +
                    "   - Defining clear inputs, outputs, users, and constraints\n" +
                    "   - Limiting scope to a manageable and buildable system\n" +
                    "   - CRITICAL: The improved statement MUST contain at least " + minWordCount + " words (the original has " + originalWordCount + " words)\n" +
                    "   - If the original is concise, expand it with relevant details while maintaining clarity\n" +
                    "   - Do NOT make it shorter than the original unless the original is unnecessarily verbose\n\n" +
                    "5. Clearly mention assumptions made during improvement.\n\n" +
                    "6. Output should be structured, concise, and suitable for a hackathon or product design review.\n\n" +
                    "IMPORTANT RULES:\n" +
                    "- Do NOT hallucinate features not implied by the original text.\n" +
                    "- Do NOT claim perfect accuracy or impossible scalability.\n" +
                    "- Use practical system design language.\n" +
                    "- Be honest and critical.\n" +
                    "- The improved statement MUST be at least " + minWordCount + " words long.\n\n" +
                    "Format your response as follows:\n" +
                    "=== ANALYSIS ===\n" +
                    "[List identified issues by category]\n\n" +
                    "=== IMPROVED PROBLEM STATEMENT ===\n" +
                    "[The rewritten, realistic problem statement - MUST be at least " + minWordCount + " words]\n\n" +
                    "=== ASSUMPTIONS ===\n" +
                    "[List of assumptions made during improvement]";

            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("model", "gpt-3.5-turbo");
            
            Map<String, String> systemMessage = new HashMap<>();
            systemMessage.put("role", "system");
            systemMessage.put("content", systemPrompt);
            
            Map<String, String> userMessage = new HashMap<>();
            userMessage.put("role", "user");
            userMessage.put("content", "Here is the problem statement to analyze and improve:\n\n<<<PROBLEM STATEMENT>>>\n\n" + originalStatement + "\n\n<<<END PROBLEM STATEMENT>>>");

            requestBody.put("messages", new Object[]{
                    systemMessage,
                    userMessage
            });
            requestBody.put("temperature", 0.7);
            requestBody.put("max_tokens", 2000); // Increased for detailed analysis

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);

            ResponseEntity<String> response = restTemplate.exchange(
                    openaiApiUrl,
                    HttpMethod.POST,
                    request,
                    String.class
            );

            // Parse the response
            JsonNode jsonResponse = objectMapper.readTree(response.getBody());
            String fullResponse = jsonResponse
                    .path("choices")
                    .get(0)
                    .path("message")
                    .path("content")
                    .asText();

            // Extract the improved problem statement from the structured response
            String improvedStatement = extractImprovedStatement(fullResponse);
            
            // If extraction failed, use the full response (fallback)
            if (improvedStatement == null || improvedStatement.trim().isEmpty()) {
                improvedStatement = fullResponse;
            }

            return improvedStatement.trim();
        } catch (Exception e) {
            System.err.println("Error calling OpenAI API: " + e.getMessage());
            e.printStackTrace();
            return "Error improving problem statement: " + e.getMessage() + 
                   ". Please check your OpenAI API key and try again.";
        }
    }

    /**
     * Extracts the improved problem statement from the structured AI response.
     * Looks for the "=== IMPROVED PROBLEM STATEMENT ===" section.
     */
    private String extractImprovedStatement(String fullResponse) {
        if (fullResponse == null || fullResponse.trim().isEmpty()) {
            return null;
        }

        // Look for the improved statement section
        String improvedMarker = "=== IMPROVED PROBLEM STATEMENT ===";
        String assumptionsMarker = "=== ASSUMPTIONS ===";
        
        int improvedStart = fullResponse.indexOf(improvedMarker);
        if (improvedStart == -1) {
            // Try alternative markers
            improvedMarker = "IMPROVED PROBLEM STATEMENT";
            improvedStart = fullResponse.indexOf(improvedMarker);
        }
        
        if (improvedStart != -1) {
            improvedStart += improvedMarker.length();
            
            // Find the end (either next section or end of text)
            int improvedEnd = fullResponse.indexOf(assumptionsMarker, improvedStart);
            if (improvedEnd == -1) {
                improvedEnd = fullResponse.length();
            }
            
            String extracted = fullResponse.substring(improvedStart, improvedEnd).trim();
            
            // Clean up any remaining markers or extra text
            extracted = extracted.replaceAll("^===.*?===\\s*", "");
            extracted = extracted.replaceAll("\\s*===.*?===$", "");
            
            return extracted.trim();
        }
        
        // If no marker found, try to find a substantial paragraph that looks like the improved statement
        // This is a fallback for cases where the AI doesn't follow the exact format
        String[] lines = fullResponse.split("\n");
        StringBuilder candidate = new StringBuilder();
        boolean inStatement = false;
        
        for (String line : lines) {
            line = line.trim();
            if (line.contains("IMPROVED") || line.contains("improved") || line.contains("rewritten")) {
                inStatement = true;
                continue;
            }
            if (inStatement && (line.contains("=== ASSUMPTIONS") || line.contains("ASSUMPTIONS"))) {
                break;
            }
            if (inStatement && line.length() > 20) {
                candidate.append(line).append("\n");
            }
        }
        
        if (candidate.length() > 50) {
            return candidate.toString().trim();
        }
        
        // Last resort: return the full response
        return fullResponse;
    }

    public String improveEligibilityCriteria(String originalEligibility) {
        // If API key is not configured, return a helpful message
        if (openaiApiKey == null || openaiApiKey.isEmpty()) {
            return "AI improvement is not configured. Please add your OpenAI API key to application.properties as 'openai.api.key'";
        }

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.set("Content-Type", "application/json");
            headers.set("Authorization", "Bearer " + openaiApiKey);

            // Create prompt for eligibility criteria improvement
            String systemPrompt = "You are an expert at writing clear and comprehensive eligibility criteria for hackathons and competitions.\n\n" +
                    "Your task is to improve the given eligibility criteria by:\n\n" +
                    "1. Making it clear and easy to understand\n" +
                    "2. Ensuring all requirements are specific and measurable\n" +
                    "3. Organizing criteria logically (e.g., by category: education, experience, location, etc.)\n" +
                    "4. Removing ambiguities and vague statements\n" +
                    "5. Adding any missing important criteria if implied by context\n" +
                    "6. Using professional but accessible language\n\n" +
                    "Format your response as:\n" +
                    "=== IMPROVED ELIGIBILITY CRITERIA ===\n" +
                    "[The improved eligibility criteria]\n\n" +
                    "Return only the improved eligibility criteria section, no additional analysis needed.";

            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("model", "gpt-3.5-turbo");
            
            Map<String, String> systemMessage = new HashMap<>();
            systemMessage.put("role", "system");
            systemMessage.put("content", systemPrompt);
            
            Map<String, String> userMessage = new HashMap<>();
            userMessage.put("role", "user");
            userMessage.put("content", "Please improve this eligibility criteria:\n\n" + originalEligibility);

            requestBody.put("messages", new Object[]{
                    systemMessage,
                    userMessage
            });
            requestBody.put("temperature", 0.7);
            requestBody.put("max_tokens", 1000);

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);

            ResponseEntity<String> response = restTemplate.exchange(
                    openaiApiUrl,
                    HttpMethod.POST,
                    request,
                    String.class
            );

            // Parse the response
            JsonNode jsonResponse = objectMapper.readTree(response.getBody());
            String fullResponse = jsonResponse
                    .path("choices")
                    .get(0)
                    .path("message")
                    .path("content")
                    .asText();

            // Extract the improved eligibility criteria
            String improved = extractImprovedSection(fullResponse, "IMPROVED ELIGIBILITY CRITERIA", "ELIGIBILITY");
            
            if (improved == null || improved.trim().isEmpty()) {
                improved = fullResponse;
            }

            return improved.trim();
        } catch (Exception e) {
            System.err.println("Error calling OpenAI API: " + e.getMessage());
            e.printStackTrace();
            return "Error improving eligibility criteria: " + e.getMessage() + 
                   ". Please check your OpenAI API key and try again.";
        }
    }

    public String improveSubmissionGuidelines(String originalGuidelines) {
        // If API key is not configured, return a helpful message
        if (openaiApiKey == null || openaiApiKey.isEmpty()) {
            return "AI improvement is not configured. Please add your OpenAI API key to application.properties as 'openai.api.key'";
        }

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.set("Content-Type", "application/json");
            headers.set("Authorization", "Bearer " + openaiApiKey);

            // Create prompt for submission guidelines improvement
            String systemPrompt = "You are an expert at writing clear and comprehensive submission guidelines for hackathons and competitions.\n\n" +
                    "Your task is to improve the given submission guidelines by:\n\n" +
                    "1. Making instructions clear and step-by-step\n" +
                    "2. Specifying exact file formats, sizes, and naming conventions\n" +
                    "3. Clearly stating deadlines and submission methods\n" +
                    "4. Listing all required deliverables\n" +
                    "5. Explaining evaluation criteria if mentioned\n" +
                    "6. Organizing information logically (what, when, where, how)\n" +
                    "7. Removing ambiguities and ensuring nothing is left unclear\n" +
                    "8. Using professional but accessible language\n\n" +
                    "Format your response as:\n" +
                    "=== IMPROVED SUBMISSION GUIDELINES ===\n" +
                    "[The improved submission guidelines]\n\n" +
                    "Return only the improved submission guidelines section, no additional analysis needed.";

            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("model", "gpt-3.5-turbo");
            
            Map<String, String> systemMessage = new HashMap<>();
            systemMessage.put("role", "system");
            systemMessage.put("content", systemPrompt);
            
            Map<String, String> userMessage = new HashMap<>();
            userMessage.put("role", "user");
            userMessage.put("content", "Please improve this submission guidelines:\n\n" + originalGuidelines);

            requestBody.put("messages", new Object[]{
                    systemMessage,
                    userMessage
            });
            requestBody.put("temperature", 0.7);
            requestBody.put("max_tokens", 1000);

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);

            ResponseEntity<String> response = restTemplate.exchange(
                    openaiApiUrl,
                    HttpMethod.POST,
                    request,
                    String.class
            );

            // Parse the response
            JsonNode jsonResponse = objectMapper.readTree(response.getBody());
            String fullResponse = jsonResponse
                    .path("choices")
                    .get(0)
                    .path("message")
                    .path("content")
                    .asText();

            // Extract the improved submission guidelines
            String improved = extractImprovedSection(fullResponse, "IMPROVED SUBMISSION GUIDELINES", "SUBMISSION");
            
            if (improved == null || improved.trim().isEmpty()) {
                improved = fullResponse;
            }

            return improved.trim();
        } catch (Exception e) {
            System.err.println("Error calling OpenAI API: " + e.getMessage());
            e.printStackTrace();
            return "Error improving submission guidelines: " + e.getMessage() + 
                   ". Please check your OpenAI API key and try again.";
        }
    }

    /**
     * Helper method to extract improved section from AI response
     */
    private String extractImprovedSection(String fullResponse, String marker, String fallbackKeyword) {
        if (fullResponse == null || fullResponse.trim().isEmpty()) {
            return null;
        }

        // Look for the improved section marker
        int improvedStart = fullResponse.indexOf(marker);
        if (improvedStart == -1) {
            // Try alternative markers
            String altMarker = marker.replace("=== ", "").replace(" ===", "");
            improvedStart = fullResponse.indexOf(altMarker);
        }
        
        if (improvedStart != -1) {
            improvedStart += marker.length();
            
            // Find the end (either next section marker or end of text)
            int improvedEnd = fullResponse.length();
            String[] endMarkers = {"===", "---", "***"};
            for (String endMarker : endMarkers) {
                int nextMarker = fullResponse.indexOf(endMarker, improvedStart);
                if (nextMarker != -1 && nextMarker < improvedEnd) {
                    improvedEnd = nextMarker;
                }
            }
            
            String extracted = fullResponse.substring(improvedStart, improvedEnd).trim();
            
            // Clean up any remaining markers
            extracted = extracted.replaceAll("^===.*?===\\s*", "");
            extracted = extracted.replaceAll("\\s*===.*?===$", "");
            
            return extracted.trim();
        }
        
        // Fallback: look for keyword and extract substantial content
        String[] lines = fullResponse.split("\n");
        StringBuilder candidate = new StringBuilder();
        boolean inSection = false;
        
        for (String line : lines) {
            line = line.trim();
            if (line.toUpperCase().contains(fallbackKeyword) && 
                (line.toUpperCase().contains("IMPROVED") || line.toUpperCase().contains("GUIDELINES") || line.toUpperCase().contains("CRITERIA"))) {
                inSection = true;
                continue;
            }
            if (inSection && line.length() > 20) {
                candidate.append(line).append("\n");
            }
        }
        
        if (candidate.length() > 50) {
            return candidate.toString().trim();
        }
        
        // Last resort: return the full response
        return fullResponse;
    }
}

