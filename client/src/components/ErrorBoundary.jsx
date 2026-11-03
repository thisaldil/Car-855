import { Component } from 'react';
export default class ErrorBoundary extends Component {
  state = { error: null };
  static getDerivedStateFromError(error) { return { error }; }
  render() {
    if (!this.state.error) return this.props.children;
    return <div className="grid min-h-screen place-items-center p-6 text-center"><div><h1 className="text-2xl font-bold">Something went wrong</h1><p className="mt-2 text-gray-500">Please refresh the page.</p><button className="btn-gold mt-4" onClick={() => location.reload()}>Reload</button></div></div>;
  }
}
