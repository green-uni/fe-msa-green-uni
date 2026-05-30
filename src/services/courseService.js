import axios from './httpRequester';

const path = 'core/student/courses';

class CourseService {

    getCourseStatus() {
        return axios.get(`${path}/status`);
    }

    // lectureType: null=전체, 'MAJOR'=전공, 'GENERAL'=교양
    courseList({ lectureType, majorId, academicYear, search, page, size } = {}) {
        return axios.get(`${path}`, {
            params: { lectureType, majorId, academicYear, search, page, size }
        });
    }

    myCourseList() {
        return axios.get(`${path}/my`);
    }

    postCourse(data) {
        return axios.post(`${path}`, data);
    }

    courseDel({ lectureId }) {
        return axios.delete(`${path}/${lectureId}`);
    }
}

export default new CourseService();