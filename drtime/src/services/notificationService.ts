export class NotificationService {
  private static instance: NotificationService;
  private permission: NotificationPermission = "default";
  private enabled: boolean = false;

  private constructor() {
    // Check if notifications are supported
    if ("Notification" in window) {
      this.permission = Notification.permission;
      this.enabled = localStorage.getItem("notifications") === "true";
    }
  }

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

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

  public async sendNotification(
    title: string,
    options: NotificationOptions = {}
  ): Promise<void> {
    if (!this.enabled || this.permission !== "granted") {
      return;
    }

    try {
      const notification = new Notification(title, {
        icon: "/bus-icon.png",
        badge: "/bus-icon.png",
        ...options,
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    } catch (error) {
      console.error("Error sending notification:", error);
    }
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    localStorage.setItem("notifications", enabled.toString());
  }
}
