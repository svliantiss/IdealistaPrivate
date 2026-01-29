const API_KEY = "AIzaSyDZ6WsChZLWXldvn0OPKYSrVZhw5gs8Rtg";

async function callGemini() {
  const url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": API_KEY
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            { text: "Write a cheerful greeting." }
          ]
        }
      ]
    })
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Error ${response.status}: ${err}`);
  }

  const data = await response.json();
  console.log(data.candidates[0].content.parts[0].text);
}

callGemini();
