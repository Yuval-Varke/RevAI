import { useState, useEffect } from 'react'
import "prismjs/themes/prism-tomorrow.css"
import Editor from "react-simple-code-editor"
import prism from "prismjs"
import Markdown from "react-markdown"
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";
import axios from 'axios'
import './App.css'

function App() {
  const [ code, setCode ] = useState(``)

  const [ review, setReview ] = useState(``)
  const [ isLoading, setIsLoading ] = useState(false)
  const [ error, setError ] = useState('')

  useEffect(() => {
    prism.highlightAll()
  }, [])

  async function reviewCode() {
    if (!code.trim()) {
      setError('Please enter some code to review')
      return
    }
    
    setIsLoading(true)
    setError('')
    setReview('')
    
    try {
      const response = await axios.post('http://localhost:3000/ai/get-review', { code })
      setReview(response.data)
    } catch (err) {
      setError('Failed to get code review. Please try again.')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  function clearCode() {
    setCode('')
    setReview('')
    setError('')
  }

  return (
    <>
      <header>
        <div className="header-title">
          <img src="/Rev ai.svg" alt="RevAI Logo" className="header-logo" />
          <h1>RevAI</h1>
        </div>
        <p>Get instant feedback on your code quality</p>
      </header>
      <main>
        <div className="left">
          <div className="editor-header">
            <h3>Your Code</h3>
            <button onClick={clearCode} className="clear-btn" title="Clear code">
              Clear
            </button>
          </div>
          <div className="code">
            <Editor
              value={code}
              onValueChange={code => setCode(code)}
              highlight={code => prism.highlight(code, prism.languages.javascript, "javascript")}
              padding={10}
              placeholder="Write your code here..."
              style={{
                fontFamily: '"Fira code", "Fira Mono", monospace',
                fontSize: 16,
                borderRadius: "5px",
                minHeight: "100%",
                width: "100%"
              }}
              textareaClassName="code-textarea"
              preClassName="code-pre"
            />
          </div>
          <button
            onClick={reviewCode}
            className={`review ${isLoading ? 'loading' : ''}`}
            disabled={isLoading}
          >
            {isLoading ? '⏳ Analyzing...' : '✨ Review Code'}
          </button>
        </div>
        <div className="right">
          <div className="review-header">
            <h3>AI Review</h3>
          </div>
          <div className="review-content">
            {error && <div className="error-message">❌ {error}</div>}
            {isLoading && (
              <div className="loader-container">
                <div className="loader">
                  <div className="spinner"></div>
                  <div className="loader-text">
                    <p className="analyzing">Analyzing your code with AI...</p>
                    <p className="wait">This may take a few seconds</p>
                  </div>
                </div>
              </div>
            )}
            {!review && !error && !isLoading && (
              <div className="placeholder">
                <div className="placeholder-icon">
                  <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <p>Write your code and click "Review Code" to get AI-powered feedback</p>
              </div>
            )}
            {review && !isLoading && (
              <Markdown rehypePlugins={[ rehypeHighlight ]}>{review}</Markdown>
            )}
          </div>
        </div>
      </main>
    </>
  )
}



export default App
