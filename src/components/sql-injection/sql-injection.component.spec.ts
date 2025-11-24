// @ts-nocheck
import { TestBed } from '@angular/core/testing';
import { SqlInjectionComponent } from './sql-injection.component';
import { GeminiService } from '../../services/gemini.service';
import { ActivityService } from '../../services/activity.service';
import { TutorialService } from '../../services/tutorial.service';
import { signal } from '@angular/core';

// Mock services
const mockGeminiService = {
  generateExplanation: jest.fn(),
  error: signal(null),
};
const mockActivityService = {
  log: jest.fn(),
};
const mockTutorialService = {
  show: jest.fn(),
};

describe('SqlInjectionComponent', () => {
  let component: SqlInjectionComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SqlInjectionComponent],
      providers: [
        { provide: GeminiService, useValue: mockGeminiService },
        { provide: ActivityService, useValue: mockActivityService },
        { provide: TutorialService, useValue: mockTutorialService },
      ],
    }).compileComponents();
    
    const fixture = TestBed.createComponent(SqlInjectionComponent);
    component = fixture.componentInstance;
    jest.clearAllMocks();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should set normal login payload', () => {
    component.setPayload('normal');
    expect(component.queryInput()).toBe(`SELECT * FROM users WHERE username = 'admin' AND password = 'password123';`);
  });

  it('should set injection attack payload', () => {
    component.setPayload('injection');
    expect(component.queryInput()).toBe(`SELECT * FROM users WHERE username = 'admin' AND password = '' OR '1'='1';`);
  });

  it('should simulate a successful injection attack', () => {
    component.setPayload('injection');
    component.executeQuery();

    const result = component.queryResult();
    expect(result).not.toBeNull();
    expect(result?.success).toBe(true);
    expect(result?.rowCount).toBe(3); // All users returned
    expect(result?.data.length).toBe(3);
    expect(result?.explanation).toContain('Authentication bypassed!');
    expect(mockActivityService.log).toHaveBeenCalledWith('SQLi Simulator', 'Executed query.');
  });
  
  it('should simulate a failed normal login', () => {
    component.queryInput.set(`SELECT * FROM users WHERE username = 'admin' AND password = 'wrongpassword';`);
    component.executeQuery();
    
    const result = component.queryResult();
    expect(result).not.toBeNull();
    expect(result?.success).toBe(false);
    expect(result?.rowCount).toBe(0);
    expect(result?.data.length).toBe(0);
    expect(result?.explanation).toContain('Authentication failed.');
  });
  
  it('should simulate a successful normal login', () => {
    component.setPayload('normal'); // Sets correct admin/password123
    component.executeQuery();
    
    const result = component.queryResult();
    expect(result).not.toBeNull();
    expect(result?.success).toBe(true);
    expect(result?.rowCount).toBe(1);
    expect(result?.data[0].username).toBe('admin');
    expect(result?.explanation).toContain('Authentication successful.');
  });
  
  it('should simulate a generic query to dump all users', () => {
    component.queryInput.set(`SELECT * FROM users;`);
    component.executeQuery();

    const result = component.queryResult();
    expect(result).not.toBeNull();
    expect(result?.success).toBe(true);
    expect(result?.rowCount).toBe(3);
    expect(result?.data.length).toBe(3);
    expect(result?.explanation).toContain('Query returned all users from the table.');
  });
  
  it('should handle an unrecognized query gracefully', () => {
    component.queryInput.set(`DROP TABLE users; --`); // A scary but unsupported query
    component.executeQuery();
    
    const result = component.queryResult();
    expect(result).not.toBeNull();
    expect(result?.success).toBe(false);
    expect(result?.rowCount).toBe(0);
    expect(result?.explanation).toContain('did not match a valid user or a known injection pattern');
  });

  it('should do nothing if query input is empty', () => {
    component.queryInput.set('   '); // Whitespace
    component.executeQuery();
    expect(component.queryResult()).toBeNull();
    expect(mockActivityService.log).not.toHaveBeenCalled();
  });
});
