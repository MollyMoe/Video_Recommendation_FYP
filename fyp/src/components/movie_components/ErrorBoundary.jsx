// components/ErrorBoundary.jsx
import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="relative w-[180px] h-[270px] bg-gray-200 rounded-2xl flex items-center justify-center">
          <span className="text-gray-500 text-sm">Error loading movie</span>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;