import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { GeminiService } from '../../services/gemini.service';
import { ActivityService } from '../../services/activity.service';
import { Tutorial, TutorialService } from '../../services/tutorial.service';
import { AnalyticsService } from '../../services/analytics.service';

@Component({
  selector: 'app-product-scraper',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './product-scraper.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductScraperComponent {
  private http = inject(HttpClient);
  geminiService = inject(GeminiService);
  activityService = inject(ActivityService);
  tutorialService = inject(TutorialService);
  analyticsService = inject(AnalyticsService);

  productUrl = signal('https://dummyjson.com/products/1');
  isLoading = signal(false);
  productData = signal<any | null>(null);
  error = signal<string | null>(null);
  selectedImage = signal<string | null>(null);

  explanation = signal('');
  isFetchingExplanation = signal(false);

  scrape() {
    if (!this.productUrl()) return;

    this.analyticsService.trackToolUsage('Product Scraper');
    this.isLoading.set(true);
    this.productData.set(null);
    this.error.set(null);
    this.selectedImage.set(null);
    this.activityService.log('Product Scraper', `Scraping initiated for ${this.productUrl()}`);
    
    const url = this.productUrl().trim();
    const match = url.match(/dummyjson\.com\/products\/(\d+)/);

    if (!match || !match[1]) {
      this.error.set('Invalid URL. Please use a URL like "https://dummyjson.com/products/{id}".');
      this.isLoading.set(false);
      return;
    }
    
    const productId = match[1];
    const apiUrl = `https://dummyjson.com/products/${productId}`;

    this.http.get(apiUrl).pipe(
      catchError(err => {
        console.error('Scraping error:', err);
        this.error.set(`Failed to fetch product data. Status: ${err.status} - ${err.statusText || 'Product not found.'}`);
        return of(null);
      })
    ).subscribe(data => {
      this.isLoading.set(false);
      if (data) {
        this.productData.set(data);
        if (data.images && data.images.length > 0) {
            this.selectedImage.set(data.images[0]);
        }
        this.activityService.log('Product Scraper', `Successfully scraped "${data.title}".`);
      }
    });
  }

  selectImage(imageUrl: string) {
    this.selectedImage.set(imageUrl);
  }

  getExplanation() {
    this.isFetchingExplanation.set(true);
    this.explanation.set('');
    this.geminiService.generateExplanation('Web Scraping for Data Collection')
      .then(text => this.explanation.set(text))
      .finally(() => this.isFetchingExplanation.set(false));
  }

  showTutorial() {
    const tutorial: Tutorial = {
      title: 'Product Scraper Tutorial',
      steps: [
        {
          title: 'Step 1: The Target URL',
          content: "Web scraping tools extract data from websites. Due to browser security (CORS), this tool can't scrape any site. It's built to work with the public API 'dummyjson.com'. Paste a product URL from that site, like the default example."
        },
        {
          title: 'Step 2: Scrape the Data',
          content: "Click 'Scrape Product Data'. The tool will make a live HTTP request to the URL, retrieve the structured product data (JSON), and parse it."
        },
        {
          title: 'Step 3: View the Results',
          content: "The scraped data, including the product title, description, price, and images, is displayed below. This demonstrates the core loop of scraping: fetch, parse, and display."
        }
      ]
    };
    this.tutorialService.show(tutorial);
  }
}
