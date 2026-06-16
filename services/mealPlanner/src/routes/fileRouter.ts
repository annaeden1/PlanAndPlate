import express from 'express';
const router = express.Router();
import multer from 'multer';

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/photos/');
  },
  filename: function (req, file, cb) {
    const ext = file.originalname.split('.').filter(Boolean).slice(1).join('.');
    cb(null, Date.now() + '.' + ext);
  },
});
const upload = multer({ storage: storage });

const handleUpload = (req: express.Request, res: express.Response) => {
  const base =
    'http://' + process.env.DOMAIN_BASE + ':' + process.env.PORT + '/';

  const filePath = req.file?.path?.replace(/\\/g, '/');
  if (!filePath) {
    res.status(400).send({ error: 'file is missing' });
    return;
  }

  const url = base + filePath;
  res.status(200).send({ url });
};

router.post('/', upload.single('file'), handleUpload);

export default router;
