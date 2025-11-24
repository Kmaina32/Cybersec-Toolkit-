// @ts-nocheck
import { ActivityService, Activity } from './activity.service';

// Helper to wait for effects to run
const tick = () => new Promise(resolve => setTimeout(resolve, 0));

describe('ActivityService', () => {
  let service: ActivityService;

  beforeEach(() => {
    service = new ActivityService();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should have an empty initial list of activities', () => {
    expect(service.activities()).toEqual([]);
  });

  it('should add a new activity to the beginning of the list', async () => {
    const initialActivities = service.activities();
    expect(initialActivities.length).toBe(0);

    service.log('Test Tool', 'Test message 1');
    await tick(); // Wait for signal to update

    const activitiesAfterFirstLog = service.activities();
    expect(activitiesAfterFirstLog.length).toBe(1);
    expect(activitiesAfterFirstLog[0].tool).toBe('Test Tool');
    expect(activitiesAfterFirstLog[0].message).toBe('Test message 1');
    
    service.log('Another Tool', 'Test message 2');
    await tick();

    const activitiesAfterSecondLog = service.activities();
    expect(activitiesAfterSecondLog.length).toBe(2);
    expect(activitiesAfterSecondLog[0].tool).toBe('Another Tool');
    expect(activitiesAfterSecondLog[0].message).toBe('Test message 2');
    expect(activitiesAfterSecondLog[1].tool).toBe('Test Tool');
  });

  it('should have a timestamp for each activity', async () => {
    service.log('Test', 'A message');
    await tick();
    const activity = service.activities()[0];
    expect(activity.timestamp).toBeInstanceOf(Date);
  });

  it('should not allow more than 20 activities in the log', async () => {
    // Log 25 activities
    for (let i = 1; i <= 25; i++) {
      service.log('Bulk Tool', `Message ${i}`);
      await tick();
    }

    const activities = service.activities();
    expect(activities.length).toBe(20);
  });

  it('should keep the most recent activities when the log is full', async () => {
     for (let i = 1; i <= 21; i++) {
      service.log('Bulk Tool', `Message ${i}`);
      await tick();
    }

    const activities = service.activities();
    expect(activities.length).toBe(20);
    // The first item should be the last one logged
    expect(activities[0].message).toBe('Message 21');
    // The last item should be the second one logged (since the first was pushed out)
    expect(activities[19].message).toBe('Message 2');
  });
});
