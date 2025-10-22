// This file is no longer needed as the lessons functionality
// has been moved to the lessons.html page with inline JavaScript
// Keeping this file for backward compatibility

// Legacy function for backward compatibility
function view(id) {
  localStorage.setItem('lesson', id);
  location.href = 'lesson-viewer.html?id=' + id;
}
