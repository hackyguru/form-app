// Clear Old Forms Script
// Run this in your browser console to clean up old form data

console.log('🧹 Cleaning up old form data...');

// Find all localStorage keys related to old forms
const keysToRemove = [];
for (let i = 0; i < localStorage.length; i++) {
  const key = localStorage.key(i);
  if (key) {
    // Check if it's related to old form-* IDs
    if (
      key.includes('form-') && 
      !key.includes('k51') // Don't remove IPNS forms
    ) {
      keysToRemove.push(key);
    }
  }
}

console.log(`Found ${keysToRemove.length} old form entries:`, keysToRemove);

// Remove them
keysToRemove.forEach(key => {
  console.log(`Removing: ${key}`);
  localStorage.removeItem(key);
});

console.log('✅ Cleanup complete! Reload the page.');
console.log('You can now create new forms with the IPNS-first architecture.');
