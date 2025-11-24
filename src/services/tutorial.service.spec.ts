// @ts-nocheck
import { TutorialService, Tutorial } from './tutorial.service';

// Helper to wait for effects to run
const tick = () => new Promise(resolve => setTimeout(resolve, 0));

describe('TutorialService', () => {
  let service: TutorialService;
  const mockTutorial: Tutorial = {
    title: 'Test Tutorial',
    steps: [
      { title: 'Step 1', content: 'Do this.' },
      { title: 'Step 2', content: 'Do that.' },
    ],
  };

  beforeEach(() => {
    service = new TutorialService();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should be hidden by default', () => {
    expect(service.isShowing()).toBe(false);
    expect(service.tutorial()).toBeNull();
  });

  it('should show a tutorial when show() is called', async () => {
    service.show(mockTutorial);
    await tick(); // Wait for signals to update

    expect(service.isShowing()).toBe(true);
    expect(service.tutorial()).toEqual(mockTutorial);
  });

  it('should hide the tutorial when hide() is called', async () => {
    // First, show it
    service.show(mockTutorial);
    await tick();
    expect(service.isShowing()).toBe(true);
    
    // Then, hide it
    service.hide();
    await tick();

    expect(service.isShowing()).toBe(false);
    expect(service.tutorial()).toBeNull();
  });

  it('should replace an existing tutorial with a new one when show() is called again', async () => {
    const anotherTutorial: Tutorial = {
      title: 'Another Tutorial',
      steps: [{ title: 'A', content: 'B' }],
    };

    service.show(mockTutorial);
    await tick();
    expect(service.tutorial()?.title).toBe('Test Tutorial');
    
    service.show(anotherTutorial);
    await tick();
    expect(service.isShowing()).toBe(true);
    expect(service.tutorial()?.title).toBe('Another Tutorial');
  });
});
