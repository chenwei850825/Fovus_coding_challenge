// File: src/App.js
import React, { useState } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [inputText, setInputText] = useState('');
  const [file, setFile] = useState(null);

  const handleTextInputChange = (event) => {
    setInputText(event.target.value);
  };

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!file) {
      alert("Please select a file before submitting.");
      return;
    }

    // Call the function to get a presigned URL and then upload the file
    try {

      const uploadResponse = await axios.post(`https://b1ej83p4hg.execute-api.ap-southeast-1.amazonaws.com`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      alert("here3")
      if (uploadResponse.status === 204) {
        // File uploaded successfully, now submit the file and text data to DynamoDB via API
        alert("here4")
        const submitResponse = await axios.post(`https://b1ej83p4hg.execute-api.ap-southeast-1.amazonaws.com/prod/process-data`, {
          inputText,
          // filePath: `${fields.key}`
          filePath: `presignedResponse`
        });
        alert('File and text submitted successfully!');
      }
    } catch (error) {
      alert('Failed to upload file and text: ' + error.message);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Fovus File Uploader</h1>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={inputText}
            onChange={handleTextInputChange}
            placeholder="Enter text"
          />
          <input
            type="file"
            onChange={handleFileChange}
          />
          <button type="submit">Submit</button>
        </form>
      </header>
    </div>
  );
}

export default App;
