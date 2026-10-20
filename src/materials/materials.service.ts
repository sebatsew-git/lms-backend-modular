import { prisma } from '../database/prisma';
import { NotFoundError, BadRequestError } from '../common/errors/AppError';
import { deleteUploadedFile, filenameFromUrl, fileMetadata } from '../storage/storage.service';

export const uploadMaterial = async (params: {
  courseId: string;
  uploaderId: string;
  title?: string;
  file?: Express.Multer.File;
}) => {
  if (!params.file) throw new BadRequestError('A file is required (field name: "file")');

  const course = await prisma.course.findUnique({ where: { id: params.courseId } });
  if (!course) throw new NotFoundError('Course not found');

  const meta = fileMetadata(params.file);

  return prisma.material.create({
    data: {
      courseId: params.courseId,
      uploaderId: params.uploaderId,
      title: params.title ?? params.file.originalname,
      ...meta,
    },
  });
};

export const listMaterialsForCourse = async (courseId: string) => {
  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) throw new NotFoundError('Course not found');

  return prisma.material.findMany({
    where: { courseId },
    orderBy: { createdAt: 'desc' },
    include: { uploader: { select: { id: true, firstName: true, lastName: true } } },
  });
};

export const getMaterialById = async (id: string) => {
  const material = await prisma.material.findUnique({
    where: { id },
    include: {
      uploader: { select: { id: true, firstName: true, lastName: true } },
      course: { select: { id: true, title: true, instructorId: true } },
    },
  });
  if (!material) throw new NotFoundError('Material not found');
  return material;
};

export const deleteMaterial = async (id: string) => {
  const material = await getMaterialById(id);

  // Remove the row first so a storage failure cannot leave a dangling reference.
  await prisma.material.delete({ where: { id } });

  try {
    await deleteUploadedFile(filenameFromUrl(material.fileUrl));
  } catch (err) {
    console.warn('🗂️ Could not delete stored file:', err);
  }

  return { id };
};
