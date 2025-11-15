/*

 MIT License

 Copyright (c) 2025 Google LLC

 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated documentation files (the "Software"), to deal
 in the Software without restriction, including without limitation the rights
 to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the Software is
 furnished to do so, subject to the following conditions:

 The above copyright notice and this permission notice shall be included in all
 copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 SOFTWARE.

 */
import React, { useState, useEffect } from 'react';

const CLIENT_ID = '679025270163-rvoofq8jj2kqavboddp9c432sf8gd11s.apps.googleusercontent.com'
const API_SCOPE = [
  "https://www.googleapis.com/auth/generative-language.peruserquota",
  "https://www.googleapis.com/auth/generative-language.retriever.readonly"
].join(" ")
const SYSTEM_INSTRUCTIONS = {
	generateSampleLookML: `You are an expert at writing LookML. You are helping another LookML developer who wants to express a rule for their LookML style guide. Your task is to take a rule provided by this user, expressed in natural language, and return a few examples in LookML that illustrate the rule with both "pass" and "fail" cases. It should contain only minimalistic LookML elements needed to illustrate the rule, but can contain light/short LookML comments inline. Rules that are purely syntactic may not require a model, but rules that may benefit from evaluating LookML extensions will benefit from being included within a model file. Your response should be an array of objects representing LookML files, with each object having a unique \`path\` string (relative from the project root) and a \`content\` string.`,
	generateRule: `TODO`
	}

const API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent"

const QuickstartPage = ({ setProjectFiles }) => {
	const [accessToken, setAccessToken] = useState(null);
	const [tokenClient, setTokenClient] = useState(null);
	const [userPrompt, setUserPrompt] = useState('');
	const [generatedCode, setGeneratedCode] = useState('');
	const [error, setError] = useState(null);
	const [isLoading, setIsLoading] = useState(false);

	useEffect(handleGsiScriptLoad, []);

	return (
		<div>
			<h2>Quick Start a Project</h2>
			<p>Choose from a pre-canned example, or generate one with AI.</p>

			<div style={{ marginBottom: '2rem' }}>
				<h3>Pre-canned Examples</h3>
				<select disabled>
					<option>Examples coming soon...</option>
				</select>
			</div>

			<div>
				<h3>Generate with AI</h3>
				<textarea value={userPrompt} onChange={(e) => setUserPrompt(e.target.value)} placeholder="Describe the rule you want to see illustrated in LookML..." style={{ width: '100%', minHeight: '80px' }} />
				{!accessToken ? (
					<button onClick={handleSignIn} disabled={!tokenClient}>Sign in with Google to Generate</button>
				) : (
					<div>
						<button onClick={handleGenerate} disabled={isLoading || !userPrompt}>{isLoading ? 'Generating...' : 'Generate'}</button>
						<button onClick={handleSignOut} style={{ marginLeft: '1rem' }}>Sign Out</button>
					</div>
				)}
				{error && <div style={{ color: 'red', marginTop: '1rem' }}>Error: {error}</div>}
				{generatedCode && <pre style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#f5f5f5', border: '1px solid #ccc', whiteSpace: 'pre-wrap' }}><code>{generatedCode}</code></pre>}
			</div>
		</div>
	);

	function handleSignIn() {
		if (tokenClient) {
			tokenClient.requestAccessToken();
		} else {
			setError("Google Authentication is not ready. Please try again in a moment.");
		}
	}

	function handleSignOut() {
		setAccessToken(null);
		setGeneratedCode('');
		setError(null);
	}

	async function handleGenerate() {
		if (!userPrompt) {
			setError("Please enter a prompt.");
			return;
		}
		setError(null);
		setIsLoading(true);
		setGeneratedCode('');
		try {
			const result = await generate(userPrompt, 'generateSampleLookML', accessToken);
			setProjectFiles(result);
			setGeneratedCode(JSON.stringify(result, null, 2));
		} catch (e) {
			setError(e.message);
		} finally {
			setIsLoading(false);
		}
	}

	function handleGsiScriptLoad() {
		if (window.google?.accounts?.oauth2) {
			initializeTokenClient();
			return;
		}

		const script = document.createElement('script');
		script.src = 'https://accounts.google.com/gsi/client';
		script.async = true;
		script.defer = true;
		script.onload = initializeTokenClient;
		script.onerror = () => {
			setError("Failed to load Google Authentication script.");
		};
		document.body.appendChild(script);

		return () => {
			// Check if the script element is still in the DOM before trying to remove it
			if (script.parentNode) {
				document.body.removeChild(script);
			}
		};
	}

	function initializeTokenClient() {
		if (window.google && window.google.accounts) {
			const client = window.google.accounts.oauth2.initTokenClient({
				client_id: CLIENT_ID,
				scope: API_SCOPE,
				callback: (tokenResponse) => {
					debugger;
					if (tokenResponse && tokenResponse.access_token) {
						setAccessToken(tokenResponse.access_token);
						setError(null);
					} else {
						setError("Failed to retrieve access token from Google.");
					}
				},
				error_callback: (error) => {
					console.error("Google Auth Error:", error);
					setError(`Google Authentication Error: ${error.type}`);
				}
			});
			setTokenClient(client);
		} else {
			console.warn("Google Identity Services library not found after script load.");
			setError("Could not initialize Google Authentication.");
		}
	}

}

export default QuickstartPage

async function generate(userPrompt, generationStage, accessToken){
	const fullPrompt = `User Request: "${userPrompt}"`;

	const requestBody = {
	  // The REST API uses 'system_instruction' in snake_case
	  "system_instruction": {
		"parts": [{"text": SYSTEM_INSTRUCTIONS[generationStage]}]
	  },
	  "contents": [{
		"parts": [{ "text": fullPrompt }]
	  }],
	  "generationConfig": {
		"temperature": 0.2,
		"responseMimeType": "application/json",
	  }
	};
	
	try {
		const response = await fetch(API_URL, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${accessToken}`,
			},
			body: JSON.stringify(requestBody)
		});

		if (!response.ok) {
			const errorBody = await response.json();
			const errorMessage = errorBody?.error?.message || `HTTP error! status: ${response.status}`;
			throw new Error(`API Error (${response.status}): ${errorMessage}`);
		}

		const data = await response.json();
		
		const jsonText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

		if (!jsonText) {
			 throw new Error("Received an empty or invalid response from the Gemini API.");
		}
		
		// The API should return valid JSON, but we parse and stringify to be safe and format it nicely.
		try {
			const parsedJson = JSON.parse(jsonText);
			return parsedJson;
		} catch (e) {
			console.error("Gemini returned non-JSON response:", jsonText);
			throw new Error("Failed to parse the API response as JSON.");
		}

	} catch (error) {
		console.error("Error calling Gemini API:", error);
		if (error instanceof Error) {
			// Re-throw the existing error to be handled by the UI.
			throw error;
		}
		throw new Error("An unknown error occurred while communicating with the Gemini API.");
	}
}
