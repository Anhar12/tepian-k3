import { createTRPCRouter } from "../..";
import { auditRouter } from "./audit";
import { authRouter } from "./auth";
import { bannerRouter } from "./banner";
import { districtRouter } from "./district";
import { employeeRouter } from "./employee";
import { employeeCertificationRouter } from "./employee-certification";
import { eventRouter } from "./event";
import { newsRouter } from "./news";
import { notificationsRouter } from "./notifications";
import { permissionRouters } from "./permission";
import { positionRouter } from "./position";
import { provinceRouter } from "./province";
import { regencyRouter } from "./regency";
import { roleRouters } from "./role";
import { userRouter } from "./user";
import { villageRouter } from "./village";
import { faqRouter } from "./faq";
import { settingRouter } from "./setting";
import { ppidRouter } from "./ppid";
import { mediaPublicationsRouter } from "./media-publications";
import { kepegawaianExcelRouter } from "./kepegawaian-excel";
import { chatbotRouter } from "./chatbot";

export const platformRouter = createTRPCRouter({
  auth: authRouter,
  user: userRouter,
  role: roleRouters,
  permission: permissionRouters,
  province: provinceRouter,
  regency: regencyRouter,
  district: districtRouter,
  village: villageRouter,
  event: eventRouter,
  audit: auditRouter,
  position: positionRouter,
  employee: employeeRouter,
  notifications: notificationsRouter,
  banner: bannerRouter,
  news: newsRouter,
  employeeCertification: employeeCertificationRouter,
  faq: faqRouter,
  setting: settingRouter,
  ppid: ppidRouter,
  mediaPublications: mediaPublicationsRouter,
  kepegawaianExcel: kepegawaianExcelRouter,
  chatbot: chatbotRouter,
});
