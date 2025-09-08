# JS Guard: AI-Powered JavaScript Security Scanner

JS Guard is a web application designed to help developers and pentesters identify and mitigate security risks in their JavaScript code. By providing a domain or a list of script URLs, the tool automatically discovers and analyzes JavaScript files using Google's Gemini AI model, delivering a detailed and actionable security report.

![JS Guard Screenshot](https://placehold.co/800x450/242933/E8EAED?text=JS%20Guard%20UI)
*<p align="center">Caption: The main interface for scanning domains or URLs.</p>*

## Key Features

- **Dual-Mode Scanning:** Offers two convenient ways to scan:
    - **Domain Scan:** Automatically crawls a website to find all linked JavaScript files.
    - **Manual URL Input:** Allows users to paste a list of specific `.js` file URLs for targeted analysis.
- **AI-Powered Deep Analysis:** Leverages the Gemini Pro model via Genkit to perform advanced static analysis on JavaScript code. The AI is instructed to act as a security expert, tracing data flows to identify complex vulnerabilities.
- **Comprehensive & Categorized Reporting:** Presents findings in a clear, interactive report, grouped into three critical categories:
    - **Hardcoded Secrets:** Detects exposed API keys, tokens, and other sensitive credentials.
    - **Security Vulnerabilities:** Flags common and advanced anti-patterns, including risks of Cross-Site Scripting (XSS), Prototype Pollution, and Client-Side Injections.
    - **Discovered Endpoints:** Maps the application's potential attack surface by listing all found URLs and API endpoints.
- **Large File Analysis:** Intelligently chunks large JavaScript files, analyzes each part, and merges the results to ensure complete coverage without hitting API rate limits.
- **Interactive UI:** A clean, responsive interface built with Next.js, React, and ShadCN UI for a seamless user experience.

![JS Guard Analysis Report](https://placehold.co/800x500/242933/E8EAED?text=Analysis%20Report)
*<p align="center">Caption: A detailed, interactive report showing vulnerabilities and secrets.</p>*

## The Vision: Evolving to a Specialized JS Security Model

While JS Guard currently uses a general-purpose AI model (Gemini) with highly specific instructions, the next evolution is to **fine-tune a dedicated, specialized model for JavaScript security analysis**.

### The Problem with General Models

General-purpose models are incredibly powerful but lack the specialized, deeply-ingrained knowledge of a domain expert. They rely entirely on the prompt for context. This can sometimes lead to:
- **Inconsistent results:** Minor changes in the code can sometimes confuse the model.
- **Missed context:** The model may not fully grasp the nuances of certain JavaScript frameworks or anti-patterns.
- **Higher costs and latency:** Larger, general models are less efficient than smaller, specialized ones.

### The Solution: A Fine-Tuned "JS-Sec-LLM"

The development plan is to create a new model by fine-tuning a base model (like Gemini) on a curated, high-quality dataset. This dataset would include:

1.  **Vulnerable Code Snippets:** Thousands of examples of JavaScript code with known vulnerabilities (XSS, CSRF, Prototype Pollution, insecure direct object references, etc.).
2.  **Secure Code Snippets:** Examples of patched code and best-practice implementations.
3.  **Code Context Pairs:** Samples showing how data flows from user input (`source`) to a dangerous function (`sink`).
4.  **Explanatory Data:** Detailed explanations of why a certain pattern is a vulnerability and how to fix it.

### Benefits of a Specialized Model

- **Higher Accuracy & Fewer False Positives:** The model will have a built-in understanding of JavaScript security, allowing it to identify real threats more reliably.
- **Deeper Understanding:** It will recognize complex vulnerability patterns that require domain-specific knowledge.
- **Improved Performance & Efficiency:** A smaller, fine-tuned model will be faster and more cost-effective to run.
- **Proactive Remediation:** The model can be trained not just to identify problems but to suggest precise, context-aware code fixes, transforming the tool from a scanner into an **interactive code remediation assistant**.

This evolution will elevate JS Guard from a powerful scanner to an indispensable security partner for all JavaScript developers.

## Tech Stack

- **Frontend:** Next.js, React, TypeScript, Tailwind CSS
- **UI Components:** ShadCN UI
- **Generative AI:** Google Gemini Pro
- **AI Framework:** Genkit
