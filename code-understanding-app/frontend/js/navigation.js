// Navigation buttons functionality
class NavigationManager {
  constructor() {
    this.pages = [
      'index.html',
      'lessons.html',
      'editor.html',
      'ai.html'
    ];
    this.currentPage = this.getCurrentPage();
    this.init();
  }

  init() {
    this.createNavigationButtons();
    this.updateButtonStates();
  }

  getCurrentPage() {
    const path = window.location.pathname;
    const filename = path.split('/').pop() || 'index.html';
    return filename;
  }

  createNavigationButtons() {
    // Create container
    const navContainer = document.createElement('div');
    navContainer.className = 'nav-buttons';

    // Back button
    const backBtn = document.createElement('button');
    backBtn.className = 'nav-btn back';
    backBtn.innerHTML = '<i class="fas fa-arrow-left"></i>';
    backBtn.title = 'Go Back';
    backBtn.onclick = () => this.goBack();

    // Forward button
    const forwardBtn = document.createElement('button');
    forwardBtn.className = 'nav-btn forward';
    forwardBtn.innerHTML = '<i class="fas fa-arrow-right"></i>';
    forwardBtn.title = 'Go Forward';
    forwardBtn.onclick = () => this.goForward();

    // Add buttons to container
    navContainer.appendChild(backBtn);
    navContainer.appendChild(forwardBtn);

    // Add to page
    document.body.appendChild(navContainer);
  }

  updateButtonStates() {
    const currentIndex = this.pages.indexOf(this.currentPage);
    const backBtn = document.querySelector('.nav-btn.back');
    const forwardBtn = document.querySelector('.nav-btn.forward');

    if (backBtn && forwardBtn) {
      // Enable/disable based on position
      backBtn.disabled = currentIndex <= 0;
      forwardBtn.disabled = currentIndex >= this.pages.length - 1;
    }
  }

  goBack() {
    const currentIndex = this.pages.indexOf(this.currentPage);
    if (currentIndex > 0) {
      const prevPage = this.pages[currentIndex - 1];
      window.location.href = prevPage;
    }
  }

  goForward() {
    const currentIndex = this.pages.indexOf(this.currentPage);
    if (currentIndex < this.pages.length - 1) {
      const nextPage = this.pages[currentIndex + 1];
      window.location.href = nextPage;
    }
  }
}

// Initialize navigation when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new NavigationManager();
});