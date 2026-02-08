import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '../index.css' // Import global styles if needed

function Options() {
    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">
                Options Page  
            </h1>
            
            {/* Here Option Component will be mounted */}
        </div>
    )
}

const root = document.getElementById('root');
if (root) {
  createRoot(root).render(
    <StrictMode>
      <Options />
    </StrictMode>
  );
}

export default Options;