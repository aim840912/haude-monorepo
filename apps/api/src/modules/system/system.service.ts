import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import type {
  SystemBanner,
  MaintenanceStatus,
  SystemStatusResponse,
} from '@haude/types';
import { UpdateMaintenanceDto } from './dto/update-maintenance.dto';
import { CreateBannerDto } from './dto/create-banner.dto';

/**
 * 系統狀態服務
 *
 * 使用記憶體快取儲存維護狀態和公告
 * 適合單一實例部署；如需多實例同步，可替換為 Redis
 */
@Injectable()
export class SystemService {
  // 記憶體儲存：維護狀態
  private maintenanceStatus: MaintenanceStatus = {
    isMaintenanceMode: false,
    allowedRoles: ['ADMIN'],
  };

  // 記憶體儲存：系統公告
  private banners: SystemBanner[] = [];

  /**
   * 取得系統狀態
   * 公開 API，用於前端輪詢
   */
  getStatus(): SystemStatusResponse {
    // 過濾已過期的公告
    const now = new Date();
    const activeBanners = this.banners.filter((banner) => {
      if (!banner.expiresAt) return true;
      return new Date(banner.expiresAt) > now;
    });

    // 決定系統狀態
    let status: 'ok' | 'degraded' | 'maintenance' = 'ok';
    if (this.maintenanceStatus.isMaintenanceMode) {
      status = 'maintenance';
    } else if (activeBanners.some((b) => b.type === 'error')) {
      status = 'degraded';
    }

    return {
      status,
      timestamp: new Date().toISOString(),
      maintenance: this.maintenanceStatus,
      banners: activeBanners,
    };
  }

  /**
   * 更新維護模式
   * 僅限管理員
   */
  updateMaintenance(dto: UpdateMaintenanceDto): MaintenanceStatus {
    this.maintenanceStatus = {
      isMaintenanceMode: dto.isMaintenanceMode,
      message: dto.message,
      estimatedEndTime: dto.estimatedEndTime,
      allowedRoles: dto.allowedRoles ?? ['ADMIN'],
    };

    return this.maintenanceStatus;
  }

  /**
   * 取得維護狀態
   */
  getMaintenance(): MaintenanceStatus {
    return this.maintenanceStatus;
  }

  /**
   * 新增系統公告
   * 僅限管理員
   */
  createBanner(dto: CreateBannerDto): SystemBanner {
    const banner: SystemBanner = {
      id: randomUUID(),
      type: dto.type,
      title: dto.title,
      message: dto.message,
      dismissible: dto.dismissible ?? true,
      expiresAt: dto.expiresAt,
      link: dto.link,
      createdAt: new Date().toISOString(),
    };

    this.banners.push(banner);
    return banner;
  }

  /**
   * 取得所有公告（含已過期）
   * 僅限管理員
   */
  getAllBanners(): SystemBanner[] {
    return this.banners;
  }

  /**
   * 刪除公告
   * 僅限管理員
   */
  deleteBanner(id: string): void {
    const index = this.banners.findIndex((b) => b.id === id);
    if (index === -1) {
      throw new NotFoundException(`Banner ${id} not found`);
    }
    this.banners.splice(index, 1);
  }

  /**
   * 清除所有公告
   * 僅限管理員
   */
  clearBanners(): void {
    this.banners = [];
  }
}
