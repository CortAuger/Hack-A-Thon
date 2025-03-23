/**
 * Notification Service
 * Manages browser notifications for the application.
 * Implements the Singleton pattern to ensure only one instance exists.
 *
 * Features:
 * - Permission management
 * - Notification preferences persistence
 * - Custom notification display
 * - Error handling
 */

export class NotificationService {
  private static instance: NotificationService;
  private permission: NotificationPermission = "default";
  private enabled: boolean = false;

  /**
   * Private constructor to prevent direct instantiation
   * Initializes notification permission state and preferences
   */
  private constructor() {
    // Check if notifications are supported
    if ("Notification" in window) {
      this.permission = Notification.permission;
      this.enabled = localStorage.getItem("notifications") === "true";
    }
  }

  /**
   * Gets the singleton instance of NotificationService
   * Creates a new instance if one doesn't exist
   * @returns The NotificationService instance
   */
  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  /**
   * Requests notification permission from the user
   * Updates permission state and local storage
   * @returns Promise resolving to whether permission was granted
   */
  public async requestPermission(): Promise<boolean> {
    if (!("Notification" in window)) {
      console.log("This browser does not support notifications");
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      this.permission = permission;
      this.enabled = permission === "granted";
      localStorage.setItem("notifications", this.enabled.toString());
      return this.enabled;
    } catch (error) {
      console.error("Error requesting notification permission:", error);
      return false;
    }
  }

  /**
   * Sends a notification if enabled and permission is granted
   * @param title The notification title
   * @param options Additional notification options
   */
  public async sendNotification(
    title: string,
    options: NotificationOptions = {}
  ): Promise<void> {
    if (!this.enabled || this.permission !== "granted") {
      return;
    }

    try {
      const notification = new Notification(title, {
        icon: "/bus-icon.png", // Default bus icon
        badge: "/bus-icon.png", // Default badge icon
        ...options,
      });

      // Handle notification click
      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    } catch (error) {
      console.error("Error sending notification:", error);
    }
  }

  /**
   * Checks if notifications are currently enabled
   * @returns Current notification enabled state
   */
  public isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Sets the notification enabled state
   * Updates local storage with the new preference
   * @param enabled New enabled state
   */
  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    localStorage.setItem("notifications", enabled.toString());
  }
}
